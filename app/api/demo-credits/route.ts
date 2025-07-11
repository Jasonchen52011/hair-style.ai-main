import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("🎬 开始演示积分系统流程");
    
    const baseUrl = req.nextUrl.origin;
    const steps = [];
    
    // 步骤1: 检查当前积分状态
    console.log("\n📊 步骤1: 检查当前积分状态");
    
    const creditsResponse = await fetch(`${baseUrl}/api/creem/user-credits`, {
      headers: {
        'Cookie': req.headers.get('cookie') || ''
      }
    });
    
    let currentCredits = 0;
    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json();
      currentCredits = creditsData.credits || 0;
      console.log(`当前积分: ${currentCredits}`);
      
      steps.push({
        step: 1,
        action: "检查当前积分",
        result: `当前积分: ${currentCredits}`,
        data: creditsData
      });
    } else {
      const errorText = await creditsResponse.text();
      console.log(`获取积分失败: ${errorText}`);
      
      steps.push({
        step: 1,
        action: "检查当前积分",
        result: `失败: ${errorText}`,
        error: true
      });
    }
    
    // 步骤2: 测试积分扣费（如果有足够积分）
    if (currentCredits >= 10) {
      console.log("\n🎨 步骤2: 测试发型生成扣费（10积分）");
      
      const consumeResponse = await fetch(`${baseUrl}/api/creem/user-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          action: 'consume',
          amount: 10,
          trans_type: 'hairstyle'
        })
      });
      
      if (consumeResponse.ok) {
        const consumeData = await consumeResponse.json();
        console.log(`扣费成功: ${consumeData.message}`);
        console.log(`剩余积分: ${consumeData.remainingCredits}`);
        
        steps.push({
          step: 2,
          action: "测试扣费10积分",
          result: `扣费成功，剩余积分: ${consumeData.remainingCredits}`,
          data: consumeData
        });
        
        // 步骤3: 再次检查积分状态
        console.log("\n📈 步骤3: 检查扣费后的积分状态");
        
        const afterConsumeResponse = await fetch(`${baseUrl}/api/creem/user-credits`, {
          headers: {
            'Cookie': req.headers.get('cookie') || ''
          }
        });
        
        if (afterConsumeResponse.ok) {
          const afterConsumeData = await afterConsumeResponse.json();
          console.log(`扣费后积分: ${afterConsumeData.credits}`);
          
          steps.push({
            step: 3,
            action: "检查扣费后积分",
            result: `积分变化: ${currentCredits} → ${afterConsumeData.credits} (扣除了 ${currentCredits - afterConsumeData.credits})`,
            data: afterConsumeData
          });
        }
        
      } else {
        const errorText = await consumeResponse.text();
        console.log(`扣费失败: ${errorText}`);
        
        steps.push({
          step: 2,
          action: "测试扣费10积分",
          result: `失败: ${errorText}`,
          error: true
        });
      }
    } else {
      console.log("\n⚠️  积分不足，跳过扣费测试");
      
      steps.push({
        step: 2,
        action: "测试扣费",
        result: `积分不足（当前: ${currentCredits}, 需要: 10），跳过测试`,
        skipped: true
      });
    }
    
    // 步骤4: 演示添加积分功能
    console.log("\n💰 步骤4: 演示添加积分功能（测试用）");
    
    const addResponse = await fetch(`${baseUrl}/api/creem/user-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        action: 'add',
        amount: 50,
        trans_type: 'bonus',
        order_no: `demo_${Date.now()}`
      })
    });
    
    if (addResponse.ok) {
      const addData = await addResponse.json();
      console.log(`添加积分成功: ${addData.message}`);
      console.log(`新的总积分: ${addData.totalCredits}`);
      
      steps.push({
        step: 4,
        action: "添加50积分（奖励）",
        result: `添加成功，新总积分: ${addData.totalCredits}`,
        data: addData
      });
    } else {
      const errorText = await addResponse.text();
      console.log(`添加积分失败: ${errorText}`);
      
      steps.push({
        step: 4,
        action: "添加积分",
        result: `失败: ${errorText}`,
        error: true
      });
    }
    
    // 步骤5: 最终积分状态
    console.log("\n📊 步骤5: 最终积分状态");
    
    const finalResponse = await fetch(`${baseUrl}/api/creem/user-credits`, {
      headers: {
        'Cookie': req.headers.get('cookie') || ''
      }
    });
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      console.log(`最终积分: ${finalData.credits}`);
      console.log(`活跃订阅: ${finalData.hasActiveSubscription ? '是' : '否'}`);
      
      steps.push({
        step: 5,
        action: "检查最终状态",
        result: `最终积分: ${finalData.credits}, 活跃订阅: ${finalData.hasActiveSubscription ? '是' : '否'}`,
        data: finalData
      });
    }
    
    console.log("\n🎉 积分系统演示完成!");
    
    return NextResponse.json({
      success: true,
      message: "积分系统演示完成",
      summary: {
        totalSteps: steps.length,
        completedSteps: steps.filter(s => !s.error && !s.skipped).length,
        failedSteps: steps.filter(s => s.error).length,
        skippedSteps: steps.filter(s => s.skipped).length
      },
      steps: steps
    });
    
  } catch (error) {
    console.error("❌ 演示失败:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 