import { NextResponse } from "next/server";

/**
 * 成功响应
 */
export function respData(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    message: message || "Success",
    data
  });
}

/**
 * 错误响应
 */
export function respErr(message: string, code?: number) {
  return NextResponse.json({
    success: false,
    error: message
  }, { status: code || 400 });
} 