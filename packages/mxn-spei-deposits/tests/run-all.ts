import { spawn } from 'child_process';
import { join } from 'path';

/**
 * Run all test files
 */
async function runAllTests() {
  console.log('🚀 Running All Tests\n');

  const testFiles = [
    'auth.simple.test.ts',
    'juno-api-client.test.ts',
    'deposit.test.ts'
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  for (const testFile of testFiles) {
    console.log(`\n📋 Running ${testFile}...`);
    console.log('─'.repeat(50));

    try {
      const result = await runTestFile(testFile);
      if (result.success) {
        totalPassed++;
        console.log(`✅ ${testFile} completed successfully`);
      } else {
        totalFailed++;
        console.log(`❌ ${testFile} failed`);
      }
    } catch (error) {
      totalFailed++;
      console.log(`❌ ${testFile} failed with error: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Final Results: ${totalPassed} test suites passed, ${totalFailed} failed`);

  if (totalFailed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please check the output above.');
  }

  return totalFailed === 0;
}

/**
 * Run a single test file
 */
function runTestFile(testFile: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve, reject) => {
    const testPath = join(__dirname, testFile);
    const child = spawn('npx', ['ts-node', testPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, output: output + errorOutput });
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Run individual test files
 */
export async function runAuthTests() {
  return runTestFile('auth.simple.test.ts');
}

export async function runJunoAPIClientTests() {
  return runTestFile('juno-api-client.test.ts');
}

export async function runDepositTests() {
  return runTestFile('deposit.test.ts');
}

// Run all tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}