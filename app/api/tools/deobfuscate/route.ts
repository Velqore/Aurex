import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: "JavaScript code is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Deobfuscating JavaScript code (${code.length} characters)`);

    try {
      // Import js-deobfuscator and handle different export patterns
      const deobfuscatorModule = require('js-deobfuscator');
      
      // Try to get the deobfuscate function (handles different export patterns)
      const deobfuscateFn = 
        typeof deobfuscatorModule === 'function' ? deobfuscatorModule :
        typeof deobfuscatorModule.deobfuscate === 'function' ? deobfuscatorModule.deobfuscate :
        typeof deobfuscatorModule.default === 'function' ? deobfuscatorModule.default :
        deobfuscatorModule.default?.deobfuscate;
      
      if (!deobfuscateFn || typeof deobfuscateFn !== 'function') {
        throw new Error('js-deobfuscator module not properly loaded');
      }
      
      // Deobfuscate the code
      const deobfuscatedCode = deobfuscateFn(code);
      
      return NextResponse.json({
        success: true,
        data: {
          original: code,
          deobfuscated: deobfuscatedCode,
          originalSize: code.length,
          deobfuscatedSize: deobfuscatedCode.length,
        },
      });
    } catch (deobfuscationError: any) {
      console.error('❌ Deobfuscation error:', deobfuscationError);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to deobfuscate code',
        error: deobfuscationError.message || 'Unknown error during deobfuscation',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("❌ Error in deobfuscation API:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
