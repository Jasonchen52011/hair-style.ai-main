import { NextResponse } from 'next/server';
import { getProductCreditsMap, getProductPlanMap } from '../../../../config';

export async function GET(req: Request) {
  try {
    const productCreditsMap = getProductCreditsMap();
    const productPlanMap = getProductPlanMap();
    
    const config = {
      productCreditsMap,
      productPlanMap,
      validProductIds: Object.keys(productCreditsMap),
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error getting product config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 