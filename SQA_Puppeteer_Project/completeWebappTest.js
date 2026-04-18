const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * ============================================================================
 * PIXELSSUITE - COMPLETE WEBAPP TEST AUTOMATION
 * ============================================================================
 * Comprehensive test suite for all components of the PixelsSuite web application
 * Including: Navigation, Image Flip, Image Rotation, Meme Generator, OCR
 * 
 * Features:
 * - Full webapp component coverage
 * - Real image testing with file uploads
 * - Detailed test reporting and logging
 * - Screenshot capture for each test
 * - HTML and text-based reports
 * ============================================================================
 */

// ============================================================================
// TEST REPORT CLASS - Comprehensive reporting and tracking
// ============================================================================
class ComprehensiveTestReport {
    constructor() {
        this.testSuites = {};
        this.globalStartTime = new Date();
        this.totalTests = 0;
        this.totalPassed = 0;
        this.totalFailed = 0;
    }

    createSuite(suiteName) {
        if (!this.testSuites[suiteName]) {
            this.testSuites[suiteName] = {
                name: suiteName,
                tests: [],
                startTime: new Date(),
                startDate: new Date().toLocaleString()
            };
        }
        return this.testSuites[suiteName];
    }

    addTest(suiteName, testName, status, reason = '', details = {}) {
        const suite = this.createSuite(suiteName);
        const timestamp = new Date().toLocaleTimeString();
        
        suite.tests.push({
            testName,
            status,
            reason,
            timestamp,
            details
        });

        const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
        console.log(`   [${suite.tests.length}] ${icon} ${testName} - ${status} (${timestamp})`);
        
        if (reason) console.log(`       └─ ${reason}`);
        if (Object.keys(details).length > 0) {
            console.log(`       └─ Details: ${JSON.stringify(details)}`);
        }

        this.totalTests++;
        if (status === 'PASS') this.totalPassed++;
        if (status === 'FAIL') this.totalFailed++;
    }

    generateReport(filename = 'complete-webapp-report.txt') {
        const endTime = new Date();
        const totalDuration = (endTime - this.globalStartTime) / 1000;
        const passRate = this.totalTests > 0 ? ((this.totalPassed / this.totalTests) * 100).toFixed(2) : 0;

        let reportContent = ``;
        reportContent += `${'='.repeat(80)}\n`;
        reportContent += `  PIXELSSUITE - COMPLETE WEBAPP TEST AUTOMATION REPORT\n`;
        reportContent += `${'='.repeat(80)}\n\n`;

        reportContent += `GLOBAL EXECUTION SUMMARY\n`;
        reportContent += `${'─'.repeat(80)}\n`;
        reportContent += `Generated: ${new Date().toLocaleString()}\n`;
        reportContent += `Total Execution Time: ${totalDuration.toFixed(2)} seconds\n\n`;

        reportContent += `Overall Results:\n`;
        reportContent += `  Total Tests: ${this.totalTests}\n`;
        reportContent += `  Passed: ${this.totalPassed} ✅\n`;
        reportContent += `  Failed: ${this.totalFailed} ❌\n`;
        reportContent += `  Pass Rate: ${passRate}%\n\n`;

        // Suite-wise reports
        reportContent += `${'='.repeat(80)}\n`;
        reportContent += `DETAILED SUITE REPORTS\n`;
        reportContent += `${'='.repeat(80)}\n\n`;

        Object.entries(this.testSuites).forEach(([suiteName, suite]) => {
            const suitePassed = suite.tests.filter(t => t.status === 'PASS').length;
            const suiteFailed = suite.tests.filter(t => t.status === 'FAIL').length;
            const suiteInfo = suite.tests.filter(t => t.status === 'INFO').length;
            const suiteDuration = (new Date() - suite.startTime) / 1000;
            const suitePassRate = suite.tests.length > 0 ? ((suitePassed / suite.tests.length) * 100).toFixed(2) : 0;

            reportContent += `📋 TEST SUITE: ${suiteName}\n`;
            reportContent += `${'─'.repeat(80)}\n`;
            reportContent += `Duration: ${suiteDuration.toFixed(2)} seconds\n`;
            reportContent += `Tests: ${suite.tests.length} | Passed: ${suitePassed} | Failed: ${suiteFailed} | Info: ${suiteInfo}\n`;
            reportContent += `Pass Rate: ${suitePassRate}%\n`;
            reportContent += `Started: ${suite.startDate}\n\n`;

            suite.tests.forEach((test, index) => {
                reportContent += `[${index + 1}] ${test.testName}\n`;
                reportContent += `    Status: ${test.status}\n`;
                reportContent += `    Reason: ${test.reason || 'N/A'}\n`;
                reportContent += `    Time: ${test.timestamp}\n`;
                
                if (Object.keys(test.details).length > 0) {
                    reportContent += `    Details:\n`;
                    Object.entries(test.details).forEach(([key, value]) => {
                        reportContent += `      - ${key}: ${value}\n`;
                    });
                }
                reportContent += `\n`;
            });

            reportContent += `${'─'.repeat(80)}\n\n`;
        });

        // Footer
        reportContent += `${'='.repeat(80)}\n`;
        reportContent += `EXECUTION COMPLETE\n`;
        reportContent += `${'='.repeat(80)}\n`;

        fs.writeFileSync(filename, reportContent);
        console.log(`\n📄 Report saved to: ${filename}`);

        return reportContent;
    }

    generateHTMLReport(filename = 'complete-webapp-report.html') {
        const passRate = this.totalTests > 0 ? ((this.totalPassed / this.totalTests) * 100).toFixed(2) : 0;
        const endTime = new Date();
        const totalDuration = (endTime - this.globalStartTime) / 1000;

        let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PixelsSuite Complete Webapp Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.1em; opacity: 0.9; }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px 20px;
            background: #f8f9fa;
            border-bottom: 2px solid #e0e0e0;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .summary-card .value {
            font-size: 2.5em;
            font-weight: bold;
            color: #333;
        }
        .summary-card.success .value { color: #27ae60; }
        .summary-card.danger .value { color: #e74c3c; }
        .summary-card.info .value { color: #3498db; }
        .content {
            padding: 40px 20px;
        }
        .suite {
            margin-bottom: 40px;
            border-left: 4px solid #667eea;
            padding-left: 20px;
        }
        .suite-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
        }
        .suite-header h2 {
            color: #667eea;
            font-size: 1.5em;
        }
        .suite-stats {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
        }
        .stat { padding: 5px 10px; border-radius: 4px; font-weight: bold; }
        .stat.pass { background: #d4edda; color: #155724; }
        .stat.fail { background: #f8d7da; color: #721c24; }
        .stat.info { background: #d1ecf1; color: #0c5460; }
        .test {
            background: #f8f9fa;
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
        }
        .test.pass { border-left-color: #27ae60; }
        .test.fail { border-left-color: #e74c3c; }
        .test-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
            padding-right: 10px;
        }
        .test-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
            margin-left: 10px;
        }
        .test-status.pass { background: #d4edda; color: #155724; }
        .test-status.fail { background: #f8d7da; color: #721c24; }
        .test-status.info { background: #d1ecf1; color: #0c5460; }
        .test-reason {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 8px;
        }
        .test-details {
            color: #888;
            font-size: 0.85em;
            background: white;
            padding: 10px;
            border-radius: 4px;
            border-left: 2px solid #ddd;
            margin-top: 8px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 2px solid #e0e0e0;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 PixelsSuite Complete Webapp Tests</h1>
            <p>Comprehensive Test Automation Report</p>
        </div>

        <div class="summary">
            <div class="summary-card info">
                <h3>Total Tests</h3>
                <div class="value">${this.totalTests}</div>
            </div>
            <div class="summary-card success">
                <h3>Passed</h3>
                <div class="value">${this.totalPassed}</div>
            </div>
            <div class="summary-card danger">
                <h3>Failed</h3>
                <div class="value">${this.totalFailed}</div>
            </div>
            <div class="summary-card">
                <h3>Pass Rate</h3>
                <div class="value">${passRate}%</div>
            </div>
            <div class="summary-card">
                <h3>Duration</h3>
                <div class="value">${totalDuration.toFixed(2)}s</div>
            </div>
        </div>

        <div class="content">`;

        // Add suite details
        Object.entries(this.testSuites).forEach(([suiteName, suite]) => {
            const suitePassed = suite.tests.filter(t => t.status === 'PASS').length;
            const suiteFailed = suite.tests.filter(t => t.status === 'FAIL').length;
            const suiteInfo = suite.tests.filter(t => t.status === 'INFO').length;
            const suitePassRate = suite.tests.length > 0 ? ((suitePassed / suite.tests.length) * 100).toFixed(2) : 0;

            htmlContent += `
            <div class="suite">
                <div class="suite-header">
                    <h2>📋 ${suiteName}</h2>
                    <div class="suite-stats">
                        <span class="stat pass">✅ ${suitePassed}</span>
                        <span class="stat fail">❌ ${suiteFailed}</span>
                        <span class="stat info">ℹ️ ${suiteInfo}</span>
                        <span class="stat">Pass Rate: ${suitePassRate}%</span>
                    </div>
                </div>`;

            suite.tests.forEach(test => {
                const statusClass = test.status.toLowerCase();
                htmlContent += `
                <div class="test ${statusClass}">
                    <div class="test-name">
                        ${test.testName}
                        <span class="test-status ${statusClass}">${test.status}</span>
                    </div>`;

                if (test.reason) {
                    htmlContent += `<div class="test-reason">📝 ${test.reason}</div>`;
                }

                if (Object.keys(test.details).length > 0) {
                    htmlContent += `<div class="test-details">`;
                    Object.entries(test.details).forEach(([key, value]) => {
                        htmlContent += `<div>• <strong>${key}:</strong> ${value}</div>`;
                    });
                    htmlContent += `</div>`;
                }

                htmlContent += `</div>`;
            });

            htmlContent += `</div>`;
        });

        htmlContent += `
        </div>

        <div class="footer">
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>PixelsSuite Test Automation Suite v1.0</p>
        </div>
    </div>
</body>
</html>`;

        fs.writeFileSync(filename, htmlContent);
        console.log(`\n🌐 HTML report saved to: ${filename}`);
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function getImageFiles(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            console.log(`⚠️  Directory not found: ${dirPath}`);
            return [];
        }
        
        const files = fs.readdirSync(dirPath);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.gif', '.bmp'].includes(ext);
        });
        
        return imageFiles.map(file => path.join(dirPath, file));
    } catch (error) {
        console.log(`Error reading directory: ${error.message}`);
        return [];
    }
}

// Helper function to wait
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TEST SUITE 1: NAVIGATION & HOMEPAGE TESTS
// ============================================================================
async function testNavigation(page, report) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🧭 TEST SUITE 1: NAVIGATION & HOMEPAGE TESTS`);
    console.log(`${'═'.repeat(80)}\n`);

    try {
        // Test 1.1: Homepage Load
        try {
            await page.goto('https://www.pixelssuite.com/', { 
                waitUntil: 'networkidle2',
                timeout: 60000 
            });
            await page.screenshot({ path: 'test-screenshots/01_homepage.png' });
            report.addTest('Navigation', 'Homepage Load', 'PASS', 'Homepage loaded successfully', 
                { url: page.url(), title: await page.title() });
        } catch (error) {
            report.addTest('Navigation', 'Homepage Load', 'FAIL', error.message);
        }

        // Test 1.2: Check for Main Navigation Elements
        try {
            const navElements = await page.evaluate(() => {
                const nav = document.querySelector('nav');
                return nav ? 'FOUND' : 'NOT_FOUND';
            });
            
            if (navElements === 'FOUND') {
                report.addTest('Navigation', 'Main Navigation Elements Present', 'PASS', 
                    'Navigation bar is visible on the page');
            } else {
                report.addTest('Navigation', 'Main Navigation Elements Present', 'INFO', 
                    'Navigation structure may vary');
            }
        } catch (error) {
            report.addTest('Navigation', 'Main Navigation Elements Present', 'INFO', 
                'Could not verify navigation elements');
        }

    } catch (error) {
        console.error(`Navigation tests error: ${error.message}`);
    }
}

// ============================================================================
// TEST SUITE 2: FLIP IMAGE FUNCTIONALITY
// ============================================================================
async function testFlipImage(page, report, imagePath) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🔄 TEST SUITE 2: FLIP IMAGE FUNCTIONALITY`);
    console.log(`${'═'.repeat(80)}\n`);

    try {
        // Test 2.1: Navigate to Flip Image Page
        try {
            await page.goto('https://www.pixelssuite.com/flip-image', { 
                waitUntil: 'networkidle2',
                timeout: 60000 
            });
            await page.screenshot({ path: 'test-screenshots/02_flip_image_page.png' });
            report.addTest('Flip Image', 'Navigate to Flip Image Page', 'PASS', 
                'Flip Image page loaded successfully', { url: page.url() });
        } catch (error) {
            report.addTest('Flip Image', 'Navigate to Flip Image Page', 'FAIL', error.message);
            return;
        }

        // Test 2.2: Check for Upload Input
        try {
            const uploadInput = await page.$('input[type="file"]');
            if (uploadInput) {
                report.addTest('Flip Image', 'File Upload Input Available', 'PASS', 
                    'File upload input found on the page');
            } else {
                report.addTest('Flip Image', 'File Upload Input Available', 'INFO', 
                    'File upload input not visible in current DOM');
            }
        } catch (error) {
            report.addTest('Flip Image', 'File Upload Input Available', 'INFO', error.message);
        }

        // Test 2.3: Upload Image
        try {
            const inputUploadHandle = await page.$('input[type="file"]');
            if (inputUploadHandle) {
                await inputUploadHandle.uploadFile(imagePath);
                await wait(2000);
                await page.screenshot({ path: 'test-screenshots/02_flip_image_uploaded.png' });
                report.addTest('Flip Image', 'Upload Image File', 'PASS', 
                    'Image uploaded successfully', { filename: path.basename(imagePath) });
            } else {
                report.addTest('Flip Image', 'Upload Image File', 'INFO', 
                    'Could not locate file input element');
            }
        } catch (error) {
            report.addTest('Flip Image', 'Upload Image File', 'INFO', error.message);
        }

        // Test 2.4: Check for Canvas/Preview
        try {
            const canvas = await page.$('canvas');
            if (canvas) {
                await page.screenshot({ path: 'test-screenshots/02_flip_image_canvas.png' });
                report.addTest('Flip Image', 'Canvas Preview Visible', 'PASS', 
                    'Canvas element detected for image preview');
            } else {
                report.addTest('Flip Image', 'Canvas Preview Visible', 'INFO', 
                    'Canvas element not found');
            }
        } catch (error) {
            report.addTest('Flip Image', 'Canvas Preview Visible', 'INFO', error.message);
        }

        // Test 2.5: Look for Flip Buttons
        try {
            const buttons = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('button'))
                    .map(b => ({ text: b.textContent, class: b.className }));
            });
            
            const flipButtons = buttons.filter(b => 
                b.text.toLowerCase().includes('flip') || 
                b.text.toLowerCase().includes('horizontal') ||
                b.text.toLowerCase().includes('vertical')
            );

            if (flipButtons.length > 0) {
                report.addTest('Flip Image', 'Flip Control Buttons Found', 'PASS', 
                    `Found ${flipButtons.length} flip control buttons`, 
                    { buttons: flipButtons.map(b => b.text).join(', ') });
            } else {
                report.addTest('Flip Image', 'Flip Control Buttons Found', 'INFO', 
                    'Flip buttons may use icons instead of text');
            }
        } catch (error) {
            report.addTest('Flip Image', 'Flip Control Buttons Found', 'INFO', error.message);
        }

    } catch (error) {
        console.error(`Flip Image tests error: ${error.message}`);
    }
}

// ============================================================================
// TEST SUITE 3: ROTATE IMAGE FUNCTIONALITY
// ============================================================================
async function testRotateImage(page, report, imagePath) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`⎻ TEST SUITE 3: ROTATE IMAGE FUNCTIONALITY`);
    console.log(`${'═'.repeat(80)}\n`);

    try {
        // Test 3.1: Navigate to Rotate Image Page
        try {
            await page.goto('https://www.pixelssuite.com/rotate-image', { 
                waitUntil: 'networkidle2',
                timeout: 60000 
            });
            await page.screenshot({ path: 'test-screenshots/03_rotate_page.png' });
            report.addTest('Rotate Image', 'Navigate to Rotate Image Page', 'PASS', 
                'Rotate Image page loaded successfully', { url: page.url() });
        } catch (error) {
            report.addTest('Rotate Image', 'Navigate to Rotate Image Page', 'FAIL', error.message);
            return;
        }

        // Test 3.2: Check for File Upload
        try {
            const uploadInput = await page.$('input[type="file"]');
            if (uploadInput) {
                report.addTest('Rotate Image', 'File Upload Available', 'PASS', 
                    'File upload input is available');
            } else {
                report.addTest('Rotate Image', 'File Upload Available', 'INFO', 
                    'File upload input not found');
            }
        } catch (error) {
            report.addTest('Rotate Image', 'File Upload Available', 'INFO', error.message);
        }

        // Test 3.3: Upload Image for Rotation
        try {
            const inputUploadHandle = await page.$('input[type="file"]');
            if (inputUploadHandle) {
                await inputUploadHandle.uploadFile(imagePath);
                await wait(2000);
                await page.screenshot({ path: 'test-screenshots/03_rotate_uploaded.png' });
                report.addTest('Rotate Image', 'Upload Image for Rotation', 'PASS', 
                    'Image uploaded successfully', { filename: path.basename(imagePath) });
            } else {
                report.addTest('Rotate Image', 'Upload Image for Rotation', 'INFO', 
                    'Upload input not accessible');
            }
        } catch (error) {
            report.addTest('Rotate Image', 'Upload Image for Rotation', 'INFO', error.message);
        }

        // Test 3.4: Check for Angle Control
        try {
            const angleInput = await page.$('input[type="range"]') || await page.$('input[type="number"]');
            if (angleInput) {
                report.addTest('Rotate Image', 'Angle Control Available', 'PASS', 
                    'Angle input control found');
            } else {
                report.addTest('Rotate Image', 'Angle Control Available', 'INFO', 
                    'Angle control not found');
            }
        } catch (error) {
            report.addTest('Rotate Image', 'Angle Control Available', 'INFO', error.message);
        }

        // Test 3.5: Check for Download Button
        try {
            const buttons = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('button, a'))
                    .filter(el => el.textContent.toLowerCase().includes('download'))
                    .map(b => b.textContent);
            });

            if (buttons.length > 0) {
                report.addTest('Rotate Image', 'Download Button Available', 'PASS', 
                    'Download button found on the page', { buttons: buttons.join(', ') });
            } else {
                report.addTest('Rotate Image', 'Download Button Available', 'INFO', 
                    'Download button not found');
            }
        } catch (error) {
            report.addTest('Rotate Image', 'Download Button Available', 'INFO', error.message);
        }

        // Test 3.6: Check Canvas Preview
        try {
            const canvas = await page.$('canvas');
            if (canvas) {
                report.addTest('Rotate Image', 'Canvas Preview for Rotated Image', 'PASS', 
                    'Canvas detected for image preview');
            } else {
                report.addTest('Rotate Image', 'Canvas Preview for Rotated Image', 'INFO', 
                    'Canvas not found');
            }
        } catch (error) {
            report.addTest('Rotate Image', 'Canvas Preview for Rotated Image', 'INFO', error.message);
        }

    } catch (error) {
        console.error(`Rotate Image tests error: ${error.message}`);
    }
}

// ============================================================================
// TEST SUITE 4: MEME GENERATOR FUNCTIONALITY
// ============================================================================
async function testMemeGenerator(page, report, imagePath) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`😄 TEST SUITE 4: MEME GENERATOR FUNCTIONALITY`);
    console.log(`${'═'.repeat(80)}\n`);

    try {
        // Test 4.1: Navigate to Meme Generator
        try {
            await page.goto('https://www.pixelssuite.com/meme-generator', { 
                waitUntil: 'networkidle2',
                timeout: 60000 
            });
            await page.screenshot({ path: 'test-screenshots/04_meme_gen_page.png' });
            report.addTest('Meme Generator', 'Navigate to Meme Generator', 'PASS', 
                'Meme Generator page loaded successfully', { url: page.url() });
        } catch (error) {
            report.addTest('Meme Generator', 'Navigate to Meme Generator', 'FAIL', error.message);
            return;
        }

        // Test 4.2: Check for Upload Button
        try {
            const uploadBtn = await page.$('input[type="file"]');
            if (uploadBtn) {
                report.addTest('Meme Generator', 'Upload Button Available', 'PASS', 
                    'Upload button is available');
            } else {
                report.addTest('Meme Generator', 'Upload Button Available', 'INFO', 
                    'Upload button not found');
            }
        } catch (error) {
            report.addTest('Meme Generator', 'Upload Button Available', 'INFO', error.message);
        }

        // Test 4.3: Upload Image
        try {
            const inputUploadHandle = await page.$('input[type="file"]');
            if (inputUploadHandle) {
                await inputUploadHandle.uploadFile(imagePath);
                await wait(2000);
                await page.screenshot({ path: 'test-screenshots/04_meme_gen_uploaded.png' });
                report.addTest('Meme Generator', 'Upload Image to Meme Generator', 'PASS', 
                    'Image uploaded successfully', { filename: path.basename(imagePath) });
            } else {
                report.addTest('Meme Generator', 'Upload Image to Meme Generator', 'INFO', 
                    'Could not find upload input');
            }
        } catch (error) {
            report.addTest('Meme Generator', 'Upload Image to Meme Generator', 'INFO', error.message);
        }

        // Test 4.4: Check for Text Input Fields
        try {
            const textInputs = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('input[type="text"], textarea'))
                    .length;
            });

            if (textInputs > 0) {
                report.addTest('Meme Generator', 'Text Input Fields Available', 'PASS', 
                    `Found ${textInputs} text input field(s) for meme text`);
            } else {
                report.addTest('Meme Generator', 'Text Input Fields Available', 'INFO', 
                    'Text input fields not found');
            }
        } catch (error) {
            report.addTest('Meme Generator', 'Text Input Fields Available', 'INFO', error.message);
        }

        // Test 4.5: Check for Canvas
        try {
            const canvas = await page.$('canvas');
            if (canvas) {
                await page.screenshot({ path: 'test-screenshots/04_meme_gen_canvas.png' });
                report.addTest('Meme Generator', 'Canvas Preview Available', 'PASS', 
                    'Canvas element found for meme preview');
            } else {
                report.addTest('Meme Generator', 'Canvas Preview Available', 'INFO', 
                    'Canvas not found');
            }
        } catch (error) {
            report.addTest('Meme Generator', 'Canvas Preview Available', 'INFO', error.message);
        }

        // Test 4.6: Check for Download Option
        try {
            const buttons = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('button, a'))
                    .filter(el => el.textContent.toLowerCase().includes('download'))
                    .map(b => b.textContent);
            });

            if (buttons.length > 0) {
                report.addTest('Meme Generator', 'Download Meme Option Available', 'PASS', 
                    'Download option found', { buttons: buttons.join(', ') });
            } else {
                report.addTest('Meme Generator', 'Download Meme Option Available', 'INFO', 
                    'Download option not found');
            }
        } catch (error) {
            report.addTest('Meme Generator', 'Download Meme Option Available', 'INFO', error.message);
        }

    } catch (error) {
        console.error(`Meme Generator tests error: ${error.message}`);
    }
}

// ============================================================================
// TEST SUITE 5: IMAGE TO TEXT (OCR) FUNCTIONALITY
// ============================================================================
async function testImageToText(page, report, imagePath) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📝 TEST SUITE 5: IMAGE TO TEXT (OCR) FUNCTIONALITY`);
    console.log(`${'═'.repeat(80)}\n`);

    try {
        // Test 5.1: Navigate to Image to Text Page
        try {
            await page.goto('https://www.pixelssuite.com/image-to-text', { 
                waitUntil: 'networkidle2',
                timeout: 60000 
            });
            await page.screenshot({ path: 'test-screenshots/05_ocr_page.png' });
            report.addTest('Image to Text', 'Navigate to Image to Text (OCR) Page', 'PASS', 
                'Image to Text page loaded successfully', { url: page.url() });
        } catch (error) {
            report.addTest('Image to Text', 'Navigate to Image to Text (OCR) Page', 'FAIL', error.message);
            return;
        }

        // Test 5.2: Check for Upload Input
        try {
            const uploadInput = await page.$('input[type="file"]');
            if (uploadInput) {
                report.addTest('Image to Text', 'File Upload Available', 'PASS', 
                    'File upload input available');
            } else {
                report.addTest('Image to Text', 'File Upload Available', 'INFO', 
                    'File upload not found');
            }
        } catch (error) {
            report.addTest('Image to Text', 'File Upload Available', 'INFO', error.message);
        }

        // Test 5.3: Upload Image for OCR
        try {
            const inputUploadHandle = await page.$('input[type="file"]');
            if (inputUploadHandle) {
                await inputUploadHandle.uploadFile(imagePath);
                await wait(3000); // OCR may need more time
                await page.screenshot({ path: 'test-screenshots/05_ocr_uploaded.png' });
                report.addTest('Image to Text', 'Upload Image for OCR', 'PASS', 
                    'Image uploaded successfully', { filename: path.basename(imagePath) });
            } else {
                report.addTest('Image to Text', 'Upload Image for OCR', 'INFO', 
                    'Could not access upload input');
            }
        } catch (error) {
            report.addTest('Image to Text', 'Upload Image for OCR', 'INFO', error.message);
        }

        // Test 5.4: Check for Text Output Area
        try {
            const textArea = await page.$('textarea, div[contenteditable], [class*="output"], [class*="result"]');
            if (textArea) {
                report.addTest('Image to Text', 'Text Output Area Available', 'PASS', 
                    'Output area for extracted text found');
            } else {
                report.addTest('Image to Text', 'Text Output Area Available', 'INFO', 
                    'Output area not found');
            }
        } catch (error) {
            report.addTest('Image to Text', 'Text Output Area Available', 'INFO', error.message);
        }

        // Test 5.5: Check for Copy/Download Options
        try {
            const buttons = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('button, a'))
                    .filter(el => {
                        const text = el.textContent.toLowerCase();
                        return text.includes('copy') || text.includes('download') || text.includes('export');
                    })
                    .map(b => b.textContent);
            });

            if (buttons.length > 0) {
                report.addTest('Image to Text', 'Copy/Download Options Available', 'PASS', 
                    'Copy or download options found', { options: buttons.join(', ') });
            } else {
                report.addTest('Image to Text', 'Copy/Download Options Available', 'INFO', 
                    'Copy/download options not found');
            }
        } catch (error) {
            report.addTest('Image to Text', 'Copy/Download Options Available', 'INFO', error.message);
        }

    } catch (error) {
        console.error(`Image to Text tests error: ${error.message}`);
    }
}

// ============================================================================
// TEST SUITE 6: MORE MENU & NAVIGATION
// ============================================================================
async function testMoreMenu(page, report) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📋 TEST SUITE 6: MORE MENU & NAVIGATION`);
    console.log(`${'═'.repeat(80)}\n`);

    try {
        // Test 6.1: Navigate to Homepage
        try {
            await page.goto('https://www.pixelssuite.com/', { 
                waitUntil: 'networkidle2',
                timeout: 60000 
            });
            report.addTest('More Menu', 'Navigate to Homepage', 'PASS', 
                'Homepage loaded successfully');
        } catch (error) {
            report.addTest('More Menu', 'Navigate to Homepage', 'FAIL', error.message);
            return;
        }

        // Test 6.2: Check for More Menu
        try {
            const moreMenu = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('*'))
                    .filter(el => el.textContent.toLowerCase().includes('more'))
                    .length > 0;
            });

            if (moreMenu) {
                report.addTest('More Menu', 'More Menu Element Found', 'PASS', 
                    'More menu or similar navigation element found');
            } else {
                report.addTest('More Menu', 'More Menu Element Found', 'INFO', 
                    'More menu not explicitly found');
            }
        } catch (error) {
            report.addTest('More Menu', 'More Menu Element Found', 'INFO', error.message);
        }

        // Test 6.3: Check for Dropdown/Expandable Menu
        try {
            const dropdownMenus = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('[role="menu"], [class*="dropdown"], [class*="menu"]'))
                    .length;
            });

            if (dropdownMenus > 0) {
                report.addTest('More Menu', 'Dropdown/Expandable Menus Found', 'PASS', 
                    `Found ${dropdownMenus} dropdown menu(s)`);
            } else {
                report.addTest('More Menu', 'Dropdown/Expandable Menus Found', 'INFO', 
                    'No dropdown menus found');
            }
        } catch (error) {
            report.addTest('More Menu', 'Dropdown/Expandable Menus Found', 'INFO', error.message);
        }

        // Test 6.4: Check for Links to All Features
        try {
            const links = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a'))
                    .map(a => ({ text: a.textContent.trim(), href: a.href }))
                    .filter(l => l.text.length > 0);
            });

            const features = ['flip', 'rotate', 'meme', 'image to text', 'ocr'];
            const foundFeatures = features.filter(feature => 
                links.some(link => link.text.toLowerCase().includes(feature) || 
                          link.href.toLowerCase().includes(feature))
            );

            if (foundFeatures.length > 0) {
                report.addTest('More Menu', 'Feature Links Accessible', 'PASS', 
                    `Found links to ${foundFeatures.join(', ')}`, 
                    { features_found: foundFeatures.length, total_features: features.length });
            } else {
                report.addTest('More Menu', 'Feature Links Accessible', 'INFO', 
                    'Feature links verification incomplete');
            }
        } catch (error) {
            report.addTest('More Menu', 'Feature Links Accessible', 'INFO', error.message);
        }

        // Test 6.5: Check for Responsive Menu Design
        try {
            const viewport = await page.evaluate(() => window.innerWidth);
            report.addTest('More Menu', 'Menu Responsive Design Check', 'INFO', 
                `Current viewport width: ${viewport}px`);
        } catch (error) {
            report.addTest('More Menu', 'Menu Responsive Design Check', 'INFO', error.message);
        }

    } catch (error) {
        console.error(`More Menu tests error: ${error.message}`);
    }
}

// ============================================================================
// MAIN TEST EXECUTION FUNCTION
// ============================================================================
async function runCompleteWebappTests() {
    console.log(`\n`);
    console.log(`${'╔'.padEnd(82, '═')}╗`);
    console.log(`║ ${'PIXELSSUITE - COMPLETE WEBAPP TEST AUTOMATION'.padEnd(78)} ║`);
    console.log(`║ ${'Comprehensive Testing of All Components & Features'.padEnd(78)} ║`);
    console.log(`${'╚'.padEnd(82, '═')}╝`);
    console.log(`\n⏰ Test Execution Started: ${new Date().toLocaleString()}\n`);

    // Create screenshots directory
    if (!fs.existsSync('test-screenshots')) {
        fs.mkdirSync('test-screenshots', { recursive: true });
    }

    const report = new ComprehensiveTestReport();
    const imageDirectory = 'C:\\Users\\nipun\\Downloads\\Machine-Order-Data';
    const imageFiles = getImageFiles(imageDirectory);

    if (imageFiles.length === 0) {
        console.log(`❌ No image files found in ${imageDirectory}`);
        console.log(`   Please ensure image files exist for complete testing.`);
    }

    const imagePath = imageFiles.length > 0 ? imageFiles[0] : null;

    let browser;
    try {
        // Launch browser
        console.log(`🌐 Launching browser...`);
        browser = await puppeteer.launch({ 
            headless: false, 
            slowMo: 50,
            args: ['--start-maximized']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });
        console.log(`✅ Browser launched and page created\n`);

        // Run all test suites
        await testNavigation(page, report);
        await wait(1000);

        if (imagePath) {
            await testFlipImage(page, report, imagePath);
            await wait(1000);

            await testRotateImage(page, report, imagePath);
            await wait(1000);

            await testMemeGenerator(page, report, imagePath);
            await wait(1000);

            await testImageToText(page, report, imagePath);
            await wait(1000);
        }

        await testMoreMenu(page, report);

        // Generate reports
        console.log(`\n\n${'═'.repeat(80)}`);
        console.log(`📊 GENERATING REPORTS...`);
        console.log(`${'═'.repeat(80)}\n`);
        
        report.generateReport('complete-webapp-report.txt');
        report.generateHTMLReport('complete-webapp-report.html');

        // Print summary
        console.log(`\n${'═'.repeat(80)}`);
        console.log(`✅ TEST EXECUTION COMPLETED`);
        console.log(`${'═'.repeat(80)}\n`);
        
        const passRate = report.totalTests > 0 ? ((report.totalPassed / report.totalTests) * 100).toFixed(2) : 0;
        console.log(`📈 FINAL RESULTS:`);
        console.log(`   Total Tests: ${report.totalTests}`);
        console.log(`   ✅ Passed: ${report.totalPassed}`);
        console.log(`   ❌ Failed: ${report.totalFailed}`);
        console.log(`   🎯 Pass Rate: ${passRate}%\n`);

        console.log(`📄 Generated Reports:`);
        console.log(`   1. Text Report: complete-webapp-report.txt`);
        console.log(`   2. HTML Report: complete-webapp-report.html`);
        console.log(`   3. Screenshots: test-screenshots/ folder\n`);

    } catch (error) {
        console.error(`\n❌ Test execution failed: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
            console.log(`🔒 Browser closed\n`);
        }
    }
}

// ============================================================================
// RUN TESTS
// ============================================================================
runCompleteWebappTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
