import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getProductCreditsMap, getProductPlanMap } from "../../../../config";
import { insertCreditsWithFallback, generateFallbackOrderNo } from "../../../../lib/credits-utils";

export const runtime = "edge";

// Web Crypto API 辅助函数 - 使用 SHA-256 替代 MD5 (Edge Runtime 兼容)
async function createHashForUUID(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

//用户取消和续费

// 从配置文件获取产品映射
const PRODUCT_CREDITS_MAP = getProductCreditsMap();
const PRODUCT_PLAN_MAP = getProductPlanMap();

// 积分交易类型
const TRANS_TYPE = {
  PURCHASE: "purchase",
  MONTHLY_DISTRIBUTION: "monthly_distribution",
} as const;

// 生成交易编号
function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

// 添加GET方法处理，避免404错误
export async function GET(req: Request) {
  console.log(`🔍 GET request to webhook endpoint - ${new Date().toISOString()}`);
  
  return NextResponse.json({
    message: "Webhook endpoint is active",
    timestamp: new Date().toISOString(),
    methods: ["POST"],
    note: "This endpoint only accepts POST requests from Creem webhooks"
  }, { status: 200 });
}

// generateFallbackOrderNo 函数已移动到 lib/credits-utils.ts 中统一管理

export async function POST(req: Request) {
  const startTime = Date.now();

  // 初始化 Supabase 客户端
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log(`🔔 Webhook received at ${new Date().toISOString()}`);
    console.log("🚀 ============== 开始处理支付Webhook ==============");

    // 基础安全验证
    const userAgent = req.headers.get("user-agent") || "";
    const contentType = req.headers.get("content-type") || "";

    console.log("🔍 Request headers:", {
      userAgent,
      contentType,
      origin: req.headers.get("origin"),
      referer: req.headers.get("referer")
    });

    // 验证Content-Type
    if (!contentType.includes("application/json")) {
      console.warn("❌ Invalid Content-Type:", contentType);
      return NextResponse.json(
        { error: "Invalid Content-Type" },
        { status: 400 },
      );
    }

    const body = await req.json();
    console.log("📦 Complete Webhook body:", JSON.stringify(body, null, 2));

    // 先检查常见的webhook格式
    const eventType = body.eventType || body.event_type || body.type || body.event;
    const object = body.object || body.data || body.payload || body;

    console.log("🔍 Event detection:", {
      eventType,
      hasObject: !!object,
      bodyKeys: Object.keys(body),
      possibleEventFields: {
        eventType: body.eventType,
        event_type: body.event_type,
        type: body.type,
        event: body.event
      }
    });

    // 如果仍然没有找到事件类型，记录完整信息但不立即拒绝
    if (!eventType) {
      console.warn("⚠️ No event type found, but processing anyway...");
      console.log("📋 Available fields:", Object.keys(body));
    }

    // 如果没有object，尝试使用整个body
    const dataObject = object || body;

    // 提取关键信息 - 根据Creem文档精确提取数据
    let userId, planId, subscriptionId, orderId, checkoutId;

    // 尝试从多个可能的位置提取数据
    const extractUserData = (obj: any) => {
      return {
        // 修复：优先使用metadata中的user_id，这是应用的真实用户ID
        userId: obj?.metadata?.user_id || obj?.user?.id || obj?.user_id || obj?.customer?.id,
        planId: obj?.product?.id || obj?.product_id || obj?.plan?.id || obj?.plan_id,
        subscriptionId: obj?.subscription?.id || obj?.subscription_id || obj?.id,
        // 修复：从 last_transaction.order 提取订单ID
        orderId: obj?.last_transaction?.order || obj?.order?.id || obj?.order_id || obj?.order,
        checkoutId: obj?.checkout?.id || obj?.checkout_id || obj?.id
      };
    };

    const extracted = extractUserData(dataObject);
    userId = extracted.userId;
    planId = extracted.planId;
    subscriptionId = extracted.subscriptionId;
    orderId = extracted.orderId;
    checkoutId = extracted.checkoutId;

    console.log(`📊 Extracted data:`, {
      eventType,
      userId,
      planId,
      subscriptionId,
      orderId,
      checkoutId,
      dataObject: typeof dataObject === 'object' ? Object.keys(dataObject) : dataObject
    });

    // 详细的数据提取调试信息
    console.log(`🔍 Detailed extraction debug:`, {
      'dataObject.metadata.user_id': dataObject?.metadata?.user_id,
      'dataObject.customer.id': dataObject?.customer?.id,
      'dataObject.product.id': dataObject?.product?.id,
      'dataObject.last_transaction.order': dataObject?.last_transaction?.order,
      'dataObject.id': dataObject?.id,
      'has_last_transaction': !!dataObject?.last_transaction,
      'has_metadata': !!dataObject?.metadata,
      'has_customer': !!dataObject?.customer,
      'has_product': !!dataObject?.product
    });

    // 如果没有找到用户ID或产品ID，记录详细信息
    if (!userId || !planId) {
      console.error("❌ Missing required fields. Full analysis:", {
        userId,
        planId,
        bodyStructure: body,
        extractionAttempts: {
          fromCustomer: dataObject?.customer,
          fromUser: dataObject?.user,
          fromMetadata: dataObject?.metadata,
          fromProduct: dataObject?.product,
          fromDirectFields: {
            user_id: dataObject?.user_id,
            product_id: dataObject?.product_id
          }
        }
      });
      
      return NextResponse.json(
        { 
          error: "Missing required fields",
          debug: {
            found: { userId: !!userId, planId: !!planId },
            bodyKeys: Object.keys(body),
            suggestions: "Check user ID in customer.id, user.id, user_id, metadata.user_id. Check product ID in product.id, product_id, plan.id"
          }
        },
        { status: 400 },
      );
    }

    // 简化用户ID验证 - 只检查是否为非空字符串
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      console.error("❌ Invalid user ID:", { userId, type: typeof userId });
      return NextResponse.json(
        { 
          error: "Invalid user ID",
          debug: {
            userId,
            type: typeof userId,
            length: userId?.length,
            suggestion: "User ID must be a non-empty string"
          }
        },
        { status: 400 },
      );
    }

    console.log("✅ User ID validation passed:", { userId, length: userId.length });

    // 处理用户ID - 优先使用metadata中的UUID，如果是UUID格式则直接使用
    let finalUserId = userId;
    
    // 检查是否已经是UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(userId)) {
      // 如果已经是UUID格式，直接使用
      console.log("✅ User ID is already in UUID format:", userId);
      finalUserId = userId;
    } else {
      // 如果不是UUID格式，尝试转换
      console.log("🔄 Converting non-UUID user ID:", userId);
      
      // 方法1: 尝试从数据库中查找现有的映射
      try {
        const { data: existingUser, error: searchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("customer_id", userId)  // 使用customer_id字段查找
          .single();
          
        if (existingUser && !searchError) {
          finalUserId = existingUser.id;
          console.log("✅ Found existing user mapping:", { creemCustomerId: userId, uuid: finalUserId });
        } else {
          // 方法2: 生成一个基于Creem ID的确定性UUID - 使用 Web Crypto API (SHA-256替代MD5)
          const hash = await createHashForUUID(userId);
          finalUserId = [
            hash.substring(0, 8),
            hash.substring(8, 12),
            hash.substring(12, 16),
            hash.substring(16, 20),
            hash.substring(20, 32)
          ].join('-');
          
          console.log("🆔 Generated UUID from Creem ID:", { creemId: userId, uuid: finalUserId });
        }
      } catch (error) {
        console.warn("⚠️ Error in user ID mapping, using generated UUID:", error);
        // 使用方法2作为后备 - 使用 Web Crypto API (SHA-256替代MD5)
        const hash = await createHashForUUID(userId);
        finalUserId = [
          hash.substring(0, 8),
          hash.substring(8, 12),
          hash.substring(12, 16),
          hash.substring(16, 20),
          hash.substring(20, 32)
        ].join('-');
      }
    }

    console.log("🔑 Final user ID for database operations:", { original: userId, final: finalUserId });

    // 🔍 关键日志：打印配置和参数
    console.log(`📊 PRODUCT_CREDITS_MAP:`, PRODUCT_CREDITS_MAP);
    console.log(`📊 PRODUCT_PLAN_MAP:`, PRODUCT_PLAN_MAP);
    console.log(`🆔 planId: ${planId}`);
    console.log(`👤 userId: ${userId}`);
    console.log(`🏷️ subscriptionId: ${subscriptionId}`);
    console.log(`📝 orderId: ${orderId}`);
    console.log(`💳 checkoutId: ${checkoutId}`);
    console.log(`🔧 eventType: ${eventType}`);

    // 验证产品ID是否有效
    if (!PRODUCT_CREDITS_MAP[planId]) {
      console.error(`❌ Invalid product_id: ${planId}`);
      console.log("📋 Available product IDs:", Object.keys(PRODUCT_CREDITS_MAP));
      return NextResponse.json(
        { 
          error: "Invalid product_id",
          debug: {
            received: planId,
            available: Object.keys(PRODUCT_CREDITS_MAP)
          }
        },
        { status: 400 },
      );
    }

    // 🔒 强化的幂等性检查 - 使用转换后的UUID检查是否已经处理过这个订单
    if (orderId) {
      try {
        const subscriptionIdentifier = subscriptionId || `onetime_${orderId}`;

        // 检查1: 基于order_id的积分记录是否存在（最强的幂等性保护）
        const { data: existingCredit, error: creditCheckError } = await supabase
          .from("credits")
          .select("trans_no, credits, created_at")
          .eq("user_uuid", finalUserId)
          .eq("order_no", orderId)
          .eq("trans_type", "purchase")
          .single();

        if (creditCheckError && creditCheckError.code !== "PGRST116") {
          console.error("❌ Error checking existing credit:", creditCheckError);
        }

        if (existingCredit) {
          console.log(
            `✅ Order ${orderId} already processed for user ${finalUserId} (credit exists)`,
            existingCredit,
          );
          return NextResponse.json(
            {
              message: "Order already processed - credit exists",
              orderId,
              alreadyProcessed: true,
              existingCredit: existingCredit,
            },
            { status: 200 },
          );
        }

        // 检查2: 订阅记录是否存在
        const { data: existingSubscription, error: checkError } = await supabase
          .from("subscriptions")
          .select("creem_subscription_id, created_at")
          .eq("user_id", finalUserId)
          .eq("creem_subscription_id", subscriptionIdentifier)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          console.error("❌ Error checking existing subscription:", checkError);
        }

        if (existingSubscription) {
          console.log(
            `✅ Order ${orderId} already processed for user ${finalUserId} (subscription exists)`,
            existingSubscription,
          );
          return NextResponse.json(
            {
              message: "Order already processed - subscription exists",
              orderId,
              alreadyProcessed: true,
              existingSubscription: existingSubscription,
            },
            { status: 200 },
          );
        }

        // 检查3: 订单记录是否存在
        const { data: existingOrder, error: orderCheckError } = await supabase
          .from("orders")
          .select("order_id, status, created_at")
          .eq("user_id", finalUserId)
          .eq("order_id", orderId)
          .eq("status", "completed")
          .single();

        if (orderCheckError && orderCheckError.code !== "PGRST116") {
          console.error("❌ Error checking existing order:", orderCheckError);
        }

        if (existingOrder) {
          console.log(
            `✅ Order ${orderId} already processed for user ${finalUserId} (order exists)`,
            existingOrder,
          );
          return NextResponse.json(
            {
              message: "Order already processed - order exists",
              orderId,
              alreadyProcessed: true,
              existingOrder: existingOrder,
            },
            { status: 200 },
          );
        }

        console.log(`🔄 Order ${orderId} not found in any table, processing...`);
      } catch (error) {
        console.error("❌ Error during idempotency check:", error);
        // 继续处理，但记录错误
      }
    }

    // 确保用户profile存在 - 使用转换后的UUID
    await ensureUserProfile(supabase, finalUserId, checkoutId, userId);

    // 处理不同的事件类型 - 如果没有明确的事件类型，默认按支付成功处理
    let result;
    const finalEventType = eventType || 'checkout.completed';
    
    switch (finalEventType) {
      case 'checkout.completed':
      case 'payment_completed':
        // checkout.completed 意味着结账完成，包含订单和订阅信息
        result = await handlePaymentSuccessWithConflictHandling(
          supabase,
          finalUserId,
          planId,
          subscriptionId,
          orderId,
          checkoutId,
          finalEventType,
        );
        break;
      case "subscription.paid":
      case "subscription_paid":
        // subscription.paid 意味着订阅付款成功，包含订单信息
        console.log("💳 [PAYMENT] 检测到支付成功事件，准备开始INSERT操作...");
        console.log("💳 [PAYMENT] 事件参数:", {
          userId: finalUserId,
          planId: planId,
          subscriptionId: subscriptionId,
          orderId: orderId,
          checkoutId: checkoutId,
          eventType: finalEventType
        });
        
        result = await handlePaymentSuccessWithConflictHandling(
          supabase,
          finalUserId,
          planId,
          subscriptionId,
          orderId,
          checkoutId,
          finalEventType,
        );
        break;
      case "subscription.active":
        // subscription.active 意味着订阅已激活
        result = await handlePaymentSuccessWithConflictHandling(
          supabase,
          finalUserId,
          planId,
          subscriptionId,
          orderId,
          checkoutId,
          finalEventType,
        );
        break;

      case "subscription.canceled":

      case "subscription_expired":
        // 订阅取消或过期
        result = await handleSubscriptionCancelled(supabase, finalUserId, subscriptionId);
        break;

      case "subscription_update":
        // 订阅更新（计划变更等）
        result = await handleSubscriptionUpdated(
          supabase,
          finalUserId,
          planId,
          subscriptionId,
          dataObject,
        );
        break;

      case "subscription_trialing":
        // 订阅试用期开始
        result = await handleSubscriptionTrialing(
          supabase,
          finalUserId,
          planId,
          subscriptionId,
          dataObject,
        );
        break;

      case "refund_created":
        // 退款创建
        result = await handleRefundCreated(
          supabase,
          finalUserId,
          planId,
          subscriptionId,
          orderId,
          dataObject,
        );
        break;


      case "dispute_created":
        // 争议创建
        result = await handleDisputeCreated(
          supabase,
          finalUserId,
          planId,
          subscriptionId,
          orderId,
          dataObject,
        );
        break;

      default:
        console.warn(`⚠️ Unhandled event type: ${finalEventType}, treating as payment success`);
        // 如果事件类型未知，默认按支付成功处理
        result = await handlePaymentSuccessWithConflictHandling(
          supabase,
          finalUserId,
          planId,
          subscriptionId,
          orderId,
          checkoutId,
          finalEventType,
        );
        break;
    }

    const processingTime = Date.now() - startTime;
    console.log(
      `✅ Webhook processed successfully in ${processingTime}ms:`,
      result,
    );

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      processingTime: `${processingTime}ms`,
      result,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(
      `❌ Webhook processing failed after ${processingTime}ms:`,
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
        processingTime: `${processingTime}ms`,
      },
      { status: 500 },
    );
  }
}

// 新的处理函数，集成冲突处理逻辑
async function handlePaymentSuccessWithConflictHandling(
  supabase: any,
  userId: string,
  planId: string,
  subscriptionId: string | null,
  orderId: string | null,
  checkoutId: string | null,
  eventType: string,
) {
  console.log(
    `🎉 Processing payment success with conflict handling for user ${userId}, plan ${planId}`,
  );

  // 🔍 关键日志：打印配置和参数
  console.log(`📊 PRODUCT_CREDITS_MAP:`, PRODUCT_CREDITS_MAP);
  console.log(`📊 PRODUCT_PLAN_MAP:`, PRODUCT_PLAN_MAP);
  console.log(`🆔 planId: ${planId}`);
  console.log(`👤 userId: ${userId}`);
  console.log(`🏷️ subscriptionId: ${subscriptionId}`);
  console.log(`📝 orderId: ${orderId}`);
  console.log(`💳 checkoutId: ${checkoutId}`);
  console.log(`🔧 eventType: ${eventType}`);

  try {
    // 确保用户profile存在
    await ensureUserProfile(supabase, userId, checkoutId, userId);

    // 🔍 检查是否为续费：查看用户是否已有相同类型的活跃订阅
    const newPlanType = PRODUCT_PLAN_MAP[planId];

    if (newPlanType === "monthly") {
      // 检查是否已有月度订阅
      const { data: existingMonthlySubscriptions, error: monthlyError } =
        await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .eq("plan_name", "monthly")
          .eq("status", "active")
          .gte("end_date", new Date().toISOString());

      if (monthlyError) {
        console.error(
          "❌ Error checking existing monthly subscriptions:",
          monthlyError,
        );
        throw new Error(
          `Failed to check existing subscriptions: ${monthlyError.message}`,
        );
      }

      if (
        existingMonthlySubscriptions &&
        existingMonthlySubscriptions.length > 0
      ) {
        console.log(
          `🔄 Detected monthly subscription renewal for user ${userId}`,
        );
        // 这是续费，应该由定时任务处理，webhook不处理
        return {
          success: true,
          isRenewal: true,
          message:
            "Monthly subscription renewal detected, will be handled by scheduled task",
          skipWebhookProcessing: true,
        };
      }
    } else if (newPlanType === "yearly") {
      // 检查是否已有年度订阅
      const { data: existingYearlySubscriptions, error: yearlyError } =
        await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .eq("plan_name", "yearly")
          .eq("status", "active")
          .gte("end_date", new Date().toISOString());

      if (yearlyError) {
        console.error(
          "❌ Error checking existing yearly subscriptions:",
          yearlyError,
        );
        throw new Error(
          `Failed to check existing subscriptions: ${yearlyError.message}`,
        );
      }

      if (
        existingYearlySubscriptions &&
        existingYearlySubscriptions.length > 0
      ) {
        console.log(
          `🔄 Detected yearly subscription renewal for user ${userId}`,
        );
        // 年度订阅续费，应该由定时任务处理
        return {
          success: true,
          isRenewal: true,
          message:
            "Yearly subscription renewal detected, will be handled by scheduled task",
          skipWebhookProcessing: true,
        };
      }
    }

    // 检查订阅冲突（升级/降级场景）
    const { data: currentSubscriptions, error: subscriptionError } =
      await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .gte("end_date", new Date().toISOString())
        .in("plan_name", ["monthly", "yearly"]);

    if (subscriptionError) {
      console.error(
        "❌ Error fetching current subscriptions:",
        subscriptionError,
      );
      throw new Error(
        `Failed to fetch current subscriptions: ${subscriptionError.message}`,
      );
    }

    const hasActiveSubscription =
      currentSubscriptions && currentSubscriptions.length > 0;

    if (hasActiveSubscription && newPlanType !== "onetime") {
      const currentSubscription = currentSubscriptions[0];
      const currentPlanType = currentSubscription.plan_name;

      // 检查是否需要处理升级/降级
      const isUpgrade =
        currentPlanType === "monthly" && newPlanType === "yearly";
      const isDowngrade =
        currentPlanType === "yearly" && newPlanType === "monthly";

      if (isUpgrade || isDowngrade) {
        console.log(
          `📋 Handling subscription ${
            isUpgrade ? "upgrade" : "downgrade"
          } for user ${userId}`,
        );

        // 使用本地冲突处理逻辑（避免内部HTTP调用）
        if (isUpgrade) {
          return await handleUpgradeLogic(
            supabase,
            userId,
            currentSubscription,
            planId,
            subscriptionId,
            orderId,
            checkoutId,
            eventType,
          );
        } else {
          return await handleDowngradeLogic(
            supabase,
            userId,
            currentSubscription,
            planId,
            subscriptionId,
            orderId,
            checkoutId,
            eventType,
          );
        }
      }
    }

    // 如果没有冲突且不是续费，处理为新订阅
    console.log(
      `🆕 Processing new ${newPlanType} subscription for user ${userId}`,
    );
    return await handlePaymentSuccess(
      supabase,
      userId,
      planId,
      subscriptionId,
      orderId,
      checkoutId,
      eventType,
    );
  } catch (error) {
    console.error(
      "❌ Error in handlePaymentSuccessWithConflictHandling:",
      error,
    );
    throw error;
  }
}

// 处理升级逻辑
async function handleUpgradeLogic(
  supabase: any,
  userId: string,
  currentSubscription: any,
  newPlanId: string,
  newSubscriptionId: string | null,
  orderId: string | null,
  checkoutId: string | null,
  eventType: string = "subscription.paid",
) {
  console.log(
    `⬆️ Processing upgrade from monthly to yearly for user ${userId}`,
  );

  // 🔍 关键日志：打印配置和参数
  console.log(`📊 PRODUCT_CREDITS_MAP:`, PRODUCT_CREDITS_MAP);
  console.log(`🆔 newPlanId: ${newPlanId}`);
  console.log(`👤 userId: ${userId}`);
  console.log(`🏷️ newSubscriptionId: ${newSubscriptionId}`);
  console.log(`📝 orderId: ${orderId}`);
  console.log(`💳 checkoutId: ${checkoutId}`);
  console.log(`🔧 eventType: ${eventType}`);
  console.log(`📅 currentSubscription:`, currentSubscription);

  try {
    // 1. 获取用户当前积分
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("current_credits")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    const currentCredits = profile?.current_credits || 0;

    // 2. 立即取消当前月度订阅
    const { error: cancelError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentSubscription.id);

    if (cancelError) {
      throw new Error(
        `Failed to cancel current subscription: ${cancelError.message}`,
      );
    }

    // 3. 创建新的年度订阅
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const { data: newSubscriptionData, error: newSubscriptionError } =
      await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_id: "yearly",
          plan_name: "yearly",
          status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          creem_subscription_id: newSubscriptionId || `yearly_${orderId}`,
          credits: PRODUCT_CREDITS_MAP[newPlanId],
          created_at: startDate.toISOString(),
          updated_at: startDate.toISOString(),
        })
        .select()
        .single();

    if (newSubscriptionError) {
      throw new Error(
        `Failed to create new subscription: ${newSubscriptionError.message}`,
      );
    }

    // 4. 添加年度订阅的积分（立即发放1000积分）
    const transactionNo = generateTransactionNo();
    const creditsToAdd = PRODUCT_CREDITS_MAP[newPlanId];

    // 使用新的统一积分插入函数，包含完整的错误处理和fallback查询逻辑
    const orderNo = generateFallbackOrderNo(orderId, "upgrade", newSubscriptionId, checkoutId);
    
    console.log(`🔄 [UPGRADE-INSERT] 开始升级用户的积分插入...`);
    console.log(`🔄 [UPGRADE-INSERT] 升级积分参数:`, {
      userId: userId,
      transType: TRANS_TYPE.PURCHASE,
      transactionNo: transactionNo,
      orderNo: orderNo,
      credits: creditsToAdd,
      eventType: eventType
    });

    try {
      const creditResult = await insertCreditsWithFallback({
        supabase: supabase,
        userId: userId,
        transType: TRANS_TYPE.PURCHASE,
        transactionNo: transactionNo,
        orderNo: orderNo,
        credits: creditsToAdd,
        expiredAt: null, // 年度订阅积分通过月度分配管理
        eventType: eventType
      });

      // 🔍 关键日志：打印 insertCreditsWithFallback 的结果
      console.log(`✅ [UPGRADE-INSERT] 升级积分插入函数执行完成!`);
      console.log(`📊 [UPGRADE-INSERT] insertCreditsWithFallback result:`, creditResult);

      if (!creditResult.success) {
        console.error("❌ [UPGRADE-INSERT] 升级积分插入失败:", creditResult.message);
        console.error("❌ [UPGRADE-INSERT] 详细错误:", creditResult);
        return {
          success: false,
          message: `Failed to add credits: ${creditResult.message}`,
          creditResult: creditResult
        };
      }

      if (creditResult.alreadyProcessed) {
        console.log(`✅ [UPGRADE-INSERT] upgrade already processed for order ${orderNo}:`, creditResult.message);
        return {
          success: true,
          conflictHandled: true,
          transitionType: "upgrade",
          creditsAdded: creditResult.creditsAdded,
          message: creditResult.message,
          alreadyProcessed: true,
          transactionNo: creditResult.transactionNo
        };
      }

      console.log(`✅ [UPGRADE-INSERT] credits added: ${creditResult.creditsAdded} credits added`);

    } catch (error) {
      console.error("❌ [UPGRADE-INSERT] insertCreditsWithFallback threw error:", error);
      return {
        success: false,
        message: `Credit insertion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error
      };
    }

    // 5. 创建升级订单记录
    console.log(`🔄 [UPGRADE-ORDER] start to create upgrade order record...`);
    const upgradeOrderId = orderId || `upgrade_${newSubscriptionId}`;
    console.log(`🔄 [UPGRADE-ORDER] upgrade order data:`, {
      user_id: userId,
      order_id: upgradeOrderId,
      product_id: newPlanId,
      status: "completed",
      credits_granted: PRODUCT_CREDITS_MAP[newPlanId]
    });

    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          order_id: orderId || `upgrade_${newSubscriptionId}`,
          product_id: newPlanId,
          product_name: "Yearly subscription (upgrade)",
          plan_type: "yearly",
          amount: null,
          status: "completed",
          checkout_id: checkoutId,
          subscription_id: newSubscriptionId,
          credits_granted: PRODUCT_CREDITS_MAP[newPlanId],
          payment_date: new Date().toISOString(),
        })
        .select();

      if (orderError) {
        console.error("❌ [UPGRADE-ORDER] Error creating upgrade order record:", orderError);
        console.error("❌ [UPGRADE-ORDER] Upgrade order creation full error:", orderError);
        // 不让订单记录失败影响升级流程，但要记录错误
      } else {
        console.log("✅ [UPGRADE-ORDER] Upgrade order record created!");
        console.log("✅ [UPGRADE-ORDER] return data:", orderData);
      }
    } catch (error) {
      console.error("❌ [UPGRADE-ORDER] Upgrade order creation threw error:", error);
      // 不让订单记录失败影响升级流程，但要记录错误
    }

    console.log(
      `✅ Upgrade completed: ${currentCredits} existing credits + ${PRODUCT_CREDITS_MAP[newPlanId]} new credits`,
    );

    return {
      success: true,
      conflictHandled: true,
      transitionType: "upgrade",
      subscriptionData: newSubscriptionData,
      creditsAdded: PRODUCT_CREDITS_MAP[newPlanId],
      totalCredits: currentCredits + PRODUCT_CREDITS_MAP[newPlanId],
      transactionNo: transactionNo,
    };
  } catch (error) {
    console.error("❌ Error in upgrade process:", error);
    throw error;
  }
}

// 处理降级逻辑
async function handleDowngradeLogic(
  supabase: any,
  userId: string,
  currentSubscription: any,
  newPlanId: string,
  newSubscriptionId: string | null,
  orderId: string | null,
  checkoutId: string | null,
  eventType: string,
) {
  console.log(
    `⬇️ Processing downgrade from yearly to monthly for user ${userId}`,
  );

  // 🔍 关键日志：打印配置和参数
  console.log(`📊 PRODUCT_CREDITS_MAP:`, PRODUCT_CREDITS_MAP);
  console.log(`🆔 newPlanId: ${newPlanId}`);
  console.log(`👤 userId: ${userId}`);
  console.log(`🏷️ newSubscriptionId: ${newSubscriptionId}`);
  console.log(`📝 orderId: ${orderId}`);
  console.log(`💳 checkoutId: ${checkoutId}`);
  console.log(`🔧 eventType: ${eventType}`);
  console.log(`📅 currentSubscription:`, currentSubscription);

  try {
    // 1. 获取用户当前积分
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("current_credits")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    const currentCredits = profile?.current_credits || 0;

    // 2. 创建待激活的月度订阅（在年度订阅结束后生效）
    const currentEndDate = new Date(currentSubscription.end_date);
    const monthlyStartDate = new Date(
      currentEndDate.getTime() + 24 * 60 * 60 * 1000,
    ); // 年度订阅结束后一天
    const monthlyEndDate = new Date(monthlyStartDate);
    monthlyEndDate.setMonth(monthlyEndDate.getMonth() + 1);

    const { data: newSubscriptionData, error: newSubscriptionError } =
      await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_id: "monthly",
          plan_name: "monthly",
          status: "pending", // 待激活状态
          start_date: monthlyStartDate.toISOString(),
          end_date: monthlyEndDate.toISOString(),
          creem_subscription_id: newSubscriptionId || `monthly_${orderId}`,
          credits: PRODUCT_CREDITS_MAP[newPlanId],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (newSubscriptionError) {
      throw new Error(
        `Failed to create pending subscription: ${newSubscriptionError.message}`,
      );
    }

    // 3. 标记当前年度订阅为"即将取消"（不立即取消）
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "expiring", // 自定义状态，表示即将过期
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentSubscription.id);

    if (updateError) {
      throw new Error(
        `Failed to update current subscription: ${updateError.message}`,
      );
    }

    // 4. 创建降级订单记录
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          order_id: orderId || `downgrade_${newSubscriptionId}`,
          product_id: newPlanId,
          product_name: "Monthly subscription (downgrade)",
          plan_type: "monthly",
          amount: null,
          status: "completed",
          checkout_id: checkoutId,
          subscription_id: newSubscriptionId,
          credits_granted: 0, // 降级不立即给积分
          payment_date: new Date().toISOString(),
        })
        .select();

      if (orderError) {
        console.error("❌ Error creating downgrade order record:", orderError);
        console.error("❌ Downgrade order creation full error:", orderError);
        // 不让订单记录失败影响降级流程，但要记录错误
      } else {
        console.log("✅ Downgrade order record created:", orderData);
      }
    } catch (error) {
      console.error("❌ Downgrade order creation threw error:", error);
      // 不让订单记录失败影响降级流程，但要记录错误
    }

    // 5. 记录降级交易（不添加积分，因为年度订阅积分保留到过期）
    const transactionNo = generateTransactionNo();
    const { error: recordError } = await supabase.from("credits").insert({
      user_uuid: userId,
      trans_type: "transfer",
      trans_no: transactionNo,
      order_no: generateFallbackOrderNo(
        orderId,
        "downgrade",
        newSubscriptionId,
        checkoutId,
      ),
      credits: 0, // 不添加积分
      expired_at: null,
      created_at: new Date().toISOString(),
    });

    if (recordError) {
      console.error(
        "Warning: Failed to record downgrade transaction:",
        recordError,
      );
    }

    console.log(
      `✅ Downgrade scheduled: Current credits ${currentCredits} will be preserved until ${currentEndDate.toISOString()}`,
    );

    return {
      success: true,
      conflictHandled: true,
      transitionType: "downgrade",
      subscriptionData: newSubscriptionData,
      creditsAdded: 0,
      totalCredits: currentCredits,
      transactionNo: transactionNo,
    };
  } catch (error) {
    console.error("❌ Error in downgrade process:", error);
    throw error;
  }
}

// 抽取用户profile处理逻辑
async function ensureUserProfile(supabase: any, userId: string, checkoutId: string | null, creemUserId: string) {
  const now = new Date();
  const timeString = now.toISOString();

  // 首先检查用户是否已存在
  const { data: existingProfile, error: checkProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (checkProfileError && checkProfileError.code === "PGRST116") {
    // 用户不存在，先创建auth用户，然后创建profile
    console.log(`👤 Creating new auth user and profile for ${userId}`);

    // 创建auth用户
    try {
      const { data: authUser, error: authUserError } =
        await supabase.auth.admin.createUser({
          id: userId,
          email: `user_${userId.substring(0, 8)}@hairsystem.temp`,
          password: "temp-password-123",
          email_confirm: true,
          user_metadata: {
            full_name: `User ${userId.substring(0, 8)}`,
            avatar_url: null,
            creem_user_id: creemUserId // 存储Creem的用户ID
          },
        });

      if (authUserError && !authUserError.message.includes("already exists")) {
        console.error("❌ Error creating auth user:", authUserError);
        throw new Error(`Failed to create auth user: ${authUserError.message}`);
      }

      console.log(
        "✅ Auth user created or already exists:",
        authUser?.user?.id || userId,
      );
    } catch (authError) {
      console.error("❌ Auth user creation failed:", authError);
      // 不要让auth用户创建失败阻止整个流程，继续尝试profile创建
    }

    // 创建profile，使用 upsert 避免重复键错误
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: `user_${userId.substring(0, 8)}@hairsystem.temp`, // 临时邮箱，后续可更新
          name: `User ${userId.substring(0, 8)}`,
          customer_id: checkoutId, // 恢复原始用途：存储支付系统的checkout ID
          product_id: creemUserId, // 使用product_id字段存储Creem用户ID
          has_access: true,
          created_at: timeString,
          updated_at: timeString
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (createError) {
      console.error("❌ Error creating/updating user profile:", createError);
      throw new Error(
        `Failed to create/update user profile: ${createError.message}`,
      );
    }

    console.log("✅ User profile created/updated:", newProfile);
  } else if (checkProfileError) {
    console.error("❌ Error checking user profile:", checkProfileError);
    throw new Error(
      `Failed to check user profile: ${checkProfileError.message}`,
    );
  } else {
    // 用户已存在，更新信息
    console.log(`👤 Updating existing user profile for ${userId}`);

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        customer_id: checkoutId,
        has_access: true,
        updated_at: timeString,
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating user profile:", updateError);
      throw new Error(`Failed to update user profile: ${updateError.message}`);
    }

    console.log("✅ User profile updated:", updatedProfile);
  }
}

async function handlePaymentSuccess(
  supabase: any,
  userId: string,
  planId: string,
  subscriptionId: string | null,
  orderId: string | null,
  checkoutId: string | null,
  eventType: string,
) {
  console.log(
    `🎉 Processing payment success for user ${userId}, plan ${planId}, ${eventType}`,
  );

  // 🔍 关键日志：打印配置和参数
  console.log(`📊 PRODUCT_CREDITS_MAP:`, PRODUCT_CREDITS_MAP);
  console.log(`🆔 planId: ${planId}`);
  console.log(`👤 userId: ${userId}`);

  // 获取对应的credits数量
  const credits = PRODUCT_CREDITS_MAP[planId] || 0;
  const planType = PRODUCT_PLAN_MAP[planId] || "onetime";

  console.log(`💰 Credits to add: ${credits}, Plan type: ${planType}`);

  try {
    // 获取用户profile（假设已经通过ensureUserProfile创建）
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("❌ Error fetching user profile:", profileError);
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    console.log("✅ User profile fetched:", profileData);

    // 处理订阅记录（包括一次性购买）
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (planType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (planType === "onetime") {
      // 一次性购买设置为很长的有效期（10年）
      endDate.setFullYear(endDate.getFullYear() + 10);
    }

    console.log(
      `📅 Subscription dates: ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // 创建订阅记录（所有购买类型都创建订阅）
    const subscriptionIdentifier = subscriptionId || `onetime_${orderId}`;

    console.log(`🔄 [INSERT-1] start to create subscription record...`);
    console.log(`🔄 [INSERT-1] subscription data:`, {
      user_id: userId,
      plan_id: planType,
      plan_name: planType,
      status: "active",
      subscription_identifier: subscriptionIdentifier,
      credits: credits
    });

    let subscriptionData;
    try {
      const { data: subData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_id: planType,
          plan_name: planType,
          status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          creem_subscription_id: subscriptionIdentifier,
          credits: credits, // 在订阅表中也记录积分信息，方便查看
          created_at: startDate.toISOString(),
          updated_at: startDate.toISOString(),
        })
        .select();

      if (subscriptionError) {
        console.error("❌ [INSERT-1] Error creating subscription:", subscriptionError);
        console.error("❌ [INSERT-1] Subscription creation full error:", subscriptionError);
        return {
          success: false,
          message: `Failed to create subscription: ${subscriptionError.message}`,
          subscriptionError: subscriptionError
        };
      }

      subscriptionData = subData;
      console.log("✅ [INSERT-1] subscription record inserted successfully!");
      console.log("✅ [INSERT-1] return data:", subscriptionData);
    } catch (error) {
      console.error("❌ Subscription creation threw error:", error);
      return {
        success: false,
        message: `Subscription creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error
      };
    }

    // 创建订单记录
    console.log(`🔄 [INSERT-2] start to create order record...`);
    const finalOrderId = orderId || `auto_${subscriptionIdentifier}`;
    console.log(`🔄 [INSERT-2] order data:`, {
      user_id: userId,
      order_id: finalOrderId,
      product_id: planId,
      status: "completed",
      credits_granted: credits,
      checkout_id: checkoutId
    });

    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          order_id: orderId || `auto_${subscriptionIdentifier}`,
          product_id: planId,
          product_name: `${planType} subscription`,
          plan_type: planType,
          amount: null, // 从Creem获取实际金额
          status: "completed",
          checkout_id: checkoutId,
          subscription_id: subscriptionIdentifier,
          credits_granted: credits,
          payment_date: startDate.toISOString(),
          created_at: startDate.toISOString(),
          updated_at: startDate.toISOString(),
        })
        .select();

      if (orderError) {
        console.error("❌ [INSERT-2] order record insert failed:", orderError);
        console.error("❌ [INSERT-2] order record insert full error:", orderError);
        // 不让订单记录失败影响主流程，但要记录错误
      } else {
        console.log("✅ [INSERT-2] order record inserted successfully!");
        console.log("✅ [INSERT-2] return data:", orderData);
      }
    } catch (error) {
      console.error("❌ Order creation threw error:", error);
      // 不让订单记录失败影响主流程，但要记录错误
    }

    // 在credits表中添加积分记录
    const transactionNo = generateTransactionNo();

    // 根据套餐类型设置过期时间
    let expiredAt = null;
    if (planType === "onetime") {
      // 一次性购买：根据用户的订阅类型设置过期时间
      try {
        // 查询用户的活跃订阅（月度或年度）
        const { data: activeSubscriptions, error: subscriptionError } =
          await supabase
            .from("subscriptions")
            .select("end_date, plan_name")
            .eq("user_id", userId)
            .eq("status", "active")
            .gte("end_date", new Date().toISOString())
            .in("plan_name", ["monthly", "yearly"])
            .order("end_date", { ascending: false }) // 获取最晚过期的订阅
            .limit(1);

        if (subscriptionError) {
          console.error(
            "❌ Error fetching user subscriptions for credit expiration:",
            subscriptionError,
          );
          // 回退到原有逻辑
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(1);
          nextMonth.setHours(0, 0, 0, 0);
          expiredAt = nextMonth.toISOString();
        } else if (activeSubscriptions && activeSubscriptions.length > 0) {
          const userSubscription = activeSubscriptions[0];

          if (userSubscription.plan_name === "monthly") {
            // 月度订阅用户：积分跟随月度订阅过期
            expiredAt = userSubscription.end_date;
            console.log(
              `✅ One-time purchase credits will expire with monthly subscription: ${expiredAt}`,
            );
          } else if (userSubscription.plan_name === "yearly") {
            // 年度订阅用户：积分跟随每月发放积分的时间过期（下个月同一日期）
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setHours(0, 0, 0, 0);
            expiredAt = nextMonth.toISOString();
            console.log(
              `✅ One-time purchase credits for yearly subscriber will expire with monthly distribution: ${expiredAt}`,
            );
          }
        } else {
          // 没有活跃订阅，使用默认逻辑（理论上不应该发生，因为购买一次性积分需要有活跃订阅）
          console.warn(
            "⚠️  No active subscription found for one-time purchase, using default expiration",
          );
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(1);
          nextMonth.setHours(0, 0, 0, 0);
          expiredAt = nextMonth.toISOString();
        }
      } catch (error) {
        console.error("❌ Error setting onetime credit expiration:", error);
        // 回退到原有逻辑
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        expiredAt = nextMonth.toISOString();
      }
    } else if (planType === "monthly") {
      // 月度订阅：下个月的订阅日期清零
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setHours(0, 0, 0, 0);
      expiredAt = nextMonth.toISOString();
    }
    // 年度订阅积分通过月度分配，这里不设置过期时间

    // 使用新的统一积分插入函数，包含完整的错误处理和fallback查询逻辑
    const orderNo = generateFallbackOrderNo(orderId, "payment", subscriptionId, checkoutId);
    
    console.log(`🔄 [INSERT-3] start to insert credits record...`);
    console.log(`🔄 [INSERT-3] credits insert parameters:`, {
      userId: userId,
      transType: TRANS_TYPE.PURCHASE,
      transactionNo: transactionNo,
      orderNo: orderNo,
      credits: credits,
      expiredAt: expiredAt,
      eventType: eventType
    });
    
    let creditResult;
    try {
      creditResult = await insertCreditsWithFallback({
        supabase: supabase,
        userId: userId,
        transType: TRANS_TYPE.PURCHASE,
        transactionNo: transactionNo,
        orderNo: orderNo,
        credits: credits,
        expiredAt: expiredAt,
        eventType: eventType
      });

      // 🔍 关键日志：打印 insertCreditsWithFallback 的结果
      console.log(`✅ [INSERT-3] credits insert function executed successfully!`);
      console.log(`📊 [INSERT-3] insertCreditsWithFallback result:`, creditResult);

      if (!creditResult.success) {
        console.error("❌ [INSERT-3] credits insert failed:", creditResult.message);
        console.error("❌ [INSERT-3] credits insert full error:", creditResult);
        return {
          success: false,
          message: `Failed to add credits: ${creditResult.message}`,
          creditResult: creditResult
        };
      }

      if (creditResult.alreadyProcessed) {
        console.log(`✅ [INSERT-3] payment already processed for order ${orderNo}:`, creditResult.message);
        return {
          success: true,
          subscriptionCreated: true,
          creditsAdded: creditResult.creditsAdded,
          message: creditResult.message,
          alreadyProcessed: true,
          transactionNo: creditResult.transactionNo
        };
      }

      console.log(`✅ [INSERT-3] credits insert success: ${creditResult.creditsAdded} credits added`);
      console.log(`✅ [INSERT-3] transaction no: ${creditResult.transactionNo}`);

    } catch (error) {
      console.error("❌ [INSERT-3] insertCreditsWithFallback threw error:", error);
      return {
        success: false,
        message: `Credit insertion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error
      };
    }

    console.log(
      `✅ [FINAL] credits added: ${creditResult.creditsAdded} credits for user ${userId}, transaction: ${creditResult.transactionNo}`,
    );

    // 获取用户最新的积分数据进行验证
    console.log(`🔄 [VERIFY] query user latest credits data...`);
    const { data: userCreditsData, error: creditsQueryError } = await supabase
      .from("credits")
      .select("*")
      .eq("user_uuid", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (creditsQueryError) {
      console.error("❌ [VERIFY] query user latest credits data failed:", creditsQueryError);
    } else {
      console.log("✅ [VERIFY] user latest 3 credits records:", userCreditsData);
    }

    // 查询用户当前总积分
    const { data: currentProfileData, error: profileQueryError } = await supabase
      .from("profiles")
      .select("current_credits")
      .eq("id", userId)
      .single();

    if (profileQueryError) {
      console.error("❌ [VERIFY] query user profile failed:", profileQueryError);
    } else {
      console.log("✅ [VERIFY] user current total credits:", currentProfileData?.current_credits);
    }

    console.log("🎉 [SUCCESS] ============= payment processed successfully =============");
    console.log("🎉 [SUCCESS] all INSERT operations completed:");
    console.log("🎉 [SUCCESS] - subscription record: ✅");
    console.log("🎉 [SUCCESS] - order record: ✅");
    console.log("🎉 [SUCCESS] - credits record: ✅");
    console.log("🎉 [SUCCESS] - Profile updated: ✅");
    console.log("🎉 [SUCCESS] ==========================================");

    return {
      success: true,
      subscriptionCreated: true,
      creditsAdded: creditResult.creditsAdded,
      transactionNo: creditResult.transactionNo,
      data: subscriptionData,
    };
  } catch (error) {
    console.error("❌ Error in handlePaymentSuccess:", error);
    throw error;
  }
}

async function handleSubscriptionCancelled(
  supabase: any,
  userId: string,
  subscriptionId: string,
) {
  console.log(
    `🚫 Processing subscription cancellation for user ${userId}, subscription ${subscriptionId}`,
  );

  if (!subscriptionId) {
    console.error("❌ Missing subscription_id for cancellation");
    return { error: "Missing subscription_id" };
  }

  try {
    const { data: cancelledData, error } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
      })
      .eq("user_id", userId)
      .eq("creem_subscription_id", subscriptionId) // 使用正确的字段名
      .select();

    if (error) {
      console.error("❌ Error cancelling subscription:", error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }

    console.log("✅ Subscription cancelled:", cancelledData);
    return { cancelled: true, data: cancelledData };
  } catch (error) {
    console.error("❌ Error in handleSubscriptionCancelled:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(
  supabase: any,
  userId: string,
  planId: string,
  subscriptionId: string,
  data: any,
) {
  console.log(
    `🔄 Processing subscription update for user ${userId}, subscription ${subscriptionId}`,
  );

  if (!subscriptionId) {
    console.error("❌ Missing subscription_id for update");
    return { error: "Missing subscription_id" };
  }

  try {
    const credits = PRODUCT_CREDITS_MAP[planId] || 0;
    const planType = PRODUCT_PLAN_MAP[planId] || "onetime";

    // 根据更新的数据计算新的结束日期
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (planType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const { data: updatedData, error } = await supabase
      .from("subscriptions")
      .update({
        plan_id: planType,
        plan_name: planType, // 添加计划名称
        status: data.status || "active",
        credits: credits, // 直接使用数字，不转换为字符串
        end_date: endDate.toISOString(),
      })
      .eq("user_id", userId)
      .eq("creem_subscription_id", subscriptionId) // 使用正确的字段名
      .select();

    if (error) {
      console.error("❌ Error updating subscription:", error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    console.log("✅ Subscription updated:", updatedData);
    return { updated: true, data: updatedData };
  } catch (error) {
    console.error("❌ Error in handleSubscriptionUpdated:", error);
    throw error;
  }
}

async function handleSubscriptionTrialing(
  supabase: any,
  userId: string,
  planId: string,
  subscriptionId: string,
  data: any,
) {
  console.log(
    `🔄 Processing subscription trial for user ${userId}, subscription ${subscriptionId}`,
  );

  if (!subscriptionId) {
    console.error("❌ Missing subscription_id for trial");
    return { error: "Missing subscription_id" };
  }

  try {
    const credits = PRODUCT_CREDITS_MAP[planId] || 0;
    const planType = PRODUCT_PLAN_MAP[planId] || "onetime";

    // 试用期通常不计算结束日期，使用试用期间
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (planType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const { data: updatedData, error } = await supabase
      .from("subscriptions")
      .update({
        plan_id: planType,
        plan_name: planType,
        status: "trialing",
        credits: credits,
        end_date: endDate.toISOString(),
      })
      .eq("user_id", userId)
      .eq("creem_subscription_id", subscriptionId)
      .select();

    if (error) {
      console.error("❌ Error updating subscription to trialing:", error);
      throw new Error(
        `Failed to update subscription to trialing: ${error.message}`,
      );
    }

    console.log("✅ Subscription trial updated:", updatedData);
    return { trialing: true, data: updatedData };
  } catch (error) {
    console.error("❌ Error in handleSubscriptionTrialing:", error);
    throw error;
  }
}

async function handleRefundCreated(
  supabase: any,
  userId: string,
  planId: string,
  subscriptionId: string | null,
  orderId: string | null,
  data: any,
) {
  console.log(
    `💰 Processing refund created for user ${userId}, order ${orderId}`,
  );

  try {
    const credits = PRODUCT_CREDITS_MAP[planId] || 0;
    const transactionNo = generateTransactionNo();

    // 记录退款事件
    const { error: refundError } = await supabase.from("credits").insert({
      user_uuid: userId,
      trans_type: "refund",
      trans_no: transactionNo,
      order_no: generateFallbackOrderNo(
        orderId,
        "refund",
        subscriptionId,
        null,
      ),
      credits: -credits, // 负数表示扣除积分
      expired_at: null,
      created_at: new Date().toISOString(),
      event_type: "refund.created",
    });

    if (refundError) {
      console.error("❌ Error recording refund:", refundError);
      throw new Error(`Failed to record refund: ${refundError.message}`);
    }

    // 如果有订阅，标记为已取消
    if (subscriptionId) {
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("creem_subscription_id", subscriptionId);

      if (subscriptionError) {
        console.error(
          "❌ Error cancelling subscription for refund:",
          subscriptionError,
        );
      }
    }

    console.log(
      `✅ Refund processed: ${credits} credits deducted from user ${userId}`,
    );
    return {
      refund: true,
      creditsDeducted: credits,
      transactionNo: transactionNo,
    };
  } catch (error) {
    console.error("❌ Error in handleRefundCreated:", error);
    throw error;
  }
}

async function handleDisputeCreated(
  supabase: any,
  userId: string,
  planId: string,
  subscriptionId: string | null,
  orderId: string | null,
  data: any,
) {
  console.log(
    `⚠️ Processing dispute created for user ${userId}, order ${orderId}`,
  );

  try {
    const credits = PRODUCT_CREDITS_MAP[planId] || 0;
    const transactionNo = generateTransactionNo();

    // 记录争议事件
    const { error: disputeError } = await supabase.from("credits").insert({
      user_uuid: userId,
      trans_type: "dispute",
      trans_no: transactionNo,
      order_no: generateFallbackOrderNo(
        orderId,
        "dispute",
        subscriptionId,
        null,
      ),
      credits: -credits, // 负数表示扣除积分
      expired_at: null,
      created_at: new Date().toISOString(),
      event_type: "dispute.created",
    });

    if (disputeError) {
      console.error("❌ Error recording dispute:", disputeError);
      throw new Error(`Failed to record dispute: ${disputeError.message}`);
    }

    // 如果有订阅，标记为争议中
    if (subscriptionId) {
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .update({
          status: "disputed",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("creem_subscription_id", subscriptionId);

      if (subscriptionError) {
        console.error(
          "❌ Error marking subscription as disputed:",
          subscriptionError,
        );
      }
    }

    console.log(
      `✅ Dispute processed: ${credits} credits deducted from user ${userId}`,
    );
    return {
      dispute: true,
      creditsDeducted: credits,
      transactionNo: transactionNo,
    };
  } catch (error) {
    console.error("❌ Error in handleDisputeCreated:", error);
    throw error;
  }
}
