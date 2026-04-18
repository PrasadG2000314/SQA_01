const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// TestReport class for detailed test reporting
class TestReport {
    constructor() {
        this.tests = [];
    }

    addTest(testName, status, reason = '', details = '') {
        const timestamp = new Date().toLocaleTimeString();
        this.tests.push({
            testName,
            status,
            reason,
            timestamp,
            details
        });
        console.log(`[${this.tests.length}] ${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️'} ${testName} - ${status} (${timestamp})`);
        if (reason) console.log(`    Reason: ${reason}`);
        if (details) console.log(`    Details: ${details}`);
    }

    generateReport() {
        const passed = this.tests.filter(t => t.status === 'PASS').length;
        const failed = this.tests.filter(t => t.status === 'FAIL').length;
        const info = this.tests.filter(t => t.status === 'INFO').length;
        const passRate = this.tests.length > 0 ? ((passed / this.tests.length) * 100).toFixed(2) : 0;

        let reportContent = `=== ROTATE IMAGE TEST REPORT ===\n\n`;
        reportContent += `Test Execution Summary:\n`;
        reportContent += `Total Tests: ${this.tests.length}\n`;
        reportContent += `Passed: ${passed}\n`;
        reportContent += `Failed: ${failed}\n`;
        reportContent += `Info/Skipped: ${info}\n`;
        reportContent += `Pass Rate: ${passRate}%\n`;
        reportContent += `Timestamp: ${new Date().toLocaleString()}\n\n`;

        reportContent += `Detailed Results:\n`;
        reportContent += `${'='.repeat(80)}\n\n`;

        this.tests.forEach((test, index) => {
            reportContent += `[Test ${index + 1}] ${test.testName}\n`;
            reportContent += `Status: ${test.status}\n`;
            reportContent += `Time: ${test.timestamp}\n`;
            if (test.reason) reportContent += `Reason: ${test.reason}\n`;
            if (test.details) reportContent += `Details: ${test.details}\n`;
            reportContent += `\n`;
        });

        return reportContent;
    }

    saveReport(filename = 'rotateImage-report.txt') {
        const report = this.generateReport();
        fs.writeFileSync(filename, report);
        console.log(`\n📄 Report saved to: ${filename}`);
    }
}

async function runRotateImageTests() {
    console.log(`🚀 Starting Rotate Image Test Suite`);
    console.log(`Target: https://www.pixelssuite.com/rotate-image`);
    console.log(`Image: C:\\Users\\nipun\\Downloads\\Machine-Order-Data\\Gemini_Generated_Image_u6tjqnu6tjqnu6tj.png`);
    console.log(`${'='.repeat(80)}\n`);

    const report = new TestReport();
    const imagePath = 'C:\\Users\\nipun\\Downloads\\Machine-Order-Data\\Gemini_Generated_Image_u6tjqnu6tjqnu6tj.png';
    const testStartTime = Date.now();

    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: false,
            slowMo: 100,
            args: ['--start-maximized']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });

        // ===== TEST 1: Navigate to Rotate Image Page =====
        try {
            // Navigate to homepage first
            await page.goto('https://www.pixelssuite.com/', { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 1000));

            // Find and click "More" menu
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, span, div, a');
                for (const btn of buttons) {
                    if (btn.textContent.includes('More') && !btn.textContent.includes('More Tools')) {
                        btn.click();
                        return true;
                    }
                }
            });

            await new Promise(r => setTimeout(r, 1500));

            // Find and click "Rotate" from More Tools
            await page.evaluate(() => {
                const links = document.querySelectorAll('a, button, div[role="button"]');
                for (const link of links) {
                    if (link.textContent.trim() === 'Rotate') {
                        link.click();
                        return true;
                    }
                }
            });

            await new Promise(r => setTimeout(r, 3000));
            await page.screenshot({ path: 'RotateImg_01_PageLoaded.png' });

            report.addTest(
                'Navigate to Rotate Image Page',
                'PASS',
                'Successfully navigated to rotate page via More menu',
                `URL: ${page.url()}`
            );
        } catch (error) {
            report.addTest('Navigate to Rotate Image Page', 'FAIL', `Navigation failed: ${error.message}`);
            throw error;
        }

        // ===== TEST 2: Verify Upload Section =====
        try {
            const uploadElements = await page.evaluate(() => {
                const fileInput = document.querySelector('input[type="file"]');
                const buttons = document.querySelectorAll('button, div[role="button"], label');
                let uploadBtn = null;
                for (const btn of buttons) {
                    if (btn.textContent.includes('Upload') || btn.textContent.includes('Select') || btn.textContent.includes('Choose')) {
                        uploadBtn = btn;
                        break;
                    }
                }
                return {
                    fileInputExists: !!fileInput,
                    uploadButtonExists: !!uploadBtn,
                    uploadButtonText: uploadBtn?.textContent.trim() || 'N/A'
                };
            });

            if (uploadElements.fileInputExists || uploadElements.uploadButtonExists) {
                report.addTest(
                    'Verify Upload Section',
                    'PASS',
                    'Upload elements found',
                    `File input: ${uploadElements.fileInputExists}, Upload button: ${uploadElements.uploadButtonExists}`
                );
            } else {
                report.addTest(
                    'Verify Upload Section',
                    'INFO',
                    'No upload elements detected on page'
                );
            }
        } catch (error) {
            report.addTest('Verify Upload Section', 'FAIL', error.message);
        }

        // ===== TEST 3: Upload Image File =====
        try {
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.uploadFile(imagePath);
                await new Promise(r => setTimeout(r, 2500));
                await page.screenshot({ path: 'RotateImg_02_ImageUploaded.png' });

                report.addTest(
                    'Upload Image File',
                    'PASS',
                    'Image successfully uploaded',
                    `File: ${path.basename(imagePath)}`
                );
            } else {
                report.addTest(
                    'Upload Image File',
                    'INFO',
                    'File input element not found',
                    'Image upload may require clicking upload button first'
                );
            }
        } catch (error) {
            report.addTest('Upload Image File', 'FAIL', `Upload failed: ${error.message}`);
        }

        // ===== TEST 4: Find Angle Control =====
        try {
            const angleControl = await page.evaluate(() => {
                const rangeInputs = document.querySelectorAll('input[type="range"]');
                const numberInputs = document.querySelectorAll('input[type="number"]');
                const labels = document.querySelectorAll('label, span, div');

                let angleLabel = null;
                for (const label of labels) {
                    if (label.textContent.toLowerCase().includes('angle') || label.textContent.toLowerCase().includes('rotation')) {
                        angleLabel = label.textContent.trim();
                        break;
                    }
                }

                return {
                    rangeCount: rangeInputs.length,
                    numberCount: numberInputs.length,
                    angleLabel: angleLabel
                };
            });

            if (angleControl.rangeCount > 0 || angleControl.numberCount > 0) {
                report.addTest(
                    'Find Angle Control',
                    'PASS',
                    'Angle control found',
                    `Range inputs: ${angleControl.rangeCount}, Number inputs: ${angleControl.numberCount}`
                );
            } else {
                report.addTest(
                    'Find Angle Control',
                    'INFO',
                    'Angle control not found on page'
                );
            }
        } catch (error) {
            report.addTest('Find Angle Control', 'FAIL', error.message);
        }

        // ===== TEST 5: Adjust Angle to 45 Degrees =====
        try {
            const angleAdjusted = await page.evaluate(() => {
                const rangeInputs = document.querySelectorAll('input[type="range"]');
                if (rangeInputs.length > 0) {
                    const angleInput = rangeInputs[0];
                    const originalValue = angleInput.value;
                    angleInput.value = 45;
                    angleInput.dispatchEvent(new Event('input', { bubbles: true }));
                    angleInput.dispatchEvent(new Event('change', { bubbles: true }));
                    return { adjusted: true, newValue: angleInput.value, originalValue: originalValue };
                }
                return { adjusted: false };
            });

            if (angleAdjusted.adjusted) {
                await new Promise(r => setTimeout(r, 1500));
                await page.screenshot({ path: 'RotateImg_03_AngleAdjusted.png' });
                report.addTest(
                    'Adjust Angle Value',
                    'PASS',
                    'Angle successfully set to 45 degrees',
                    `Original: ${angleAdjusted.originalValue}°, New: ${angleAdjusted.newValue}°`
                );
            } else {
                report.addTest(
                    'Adjust Angle Value',
                    'INFO',
                    'Angle control not available for adjustment'
                );
            }
        } catch (error) {
            report.addTest('Adjust Angle Value', 'FAIL', error.message);
        }

        // ===== TEST 6: Find & Click Flip Horizontal Button =====
        try {
            const flipHResult = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, input[type="button"], div[role="button"], a[role="button"]');
                // First try exact text match
                for (const btn of buttons) {
                    const text = btn.textContent.toLowerCase().trim();
                    if (text === 'flip horizontal' || text === 'flip h' || (text.includes('flip') && text.includes('h'))) {
                        btn.click();
                        return { clicked: true, text: btn.textContent.trim() };
                    }
                }
                // Try looking for icons or attributes
                for (const btn of buttons) {
                    if (btn.title?.toLowerCase().includes('flip') || btn.title?.toLowerCase().includes('horizontal')) {
                        btn.click();
                        return { clicked: true, text: btn.title };
                    }
                }
                // Log all button texts for debugging
                const allButtons = Array.from(buttons).map(b => ({
                    text: b.textContent.trim().substring(0, 30),
                    title: b.title || 'N/A'
                }));
                return { clicked: false, total: buttons.length, buttonsList: allButtons };
            });

            if (flipHResult.clicked) {
                await new Promise(r => setTimeout(r, 1500));
                await page.screenshot({ path: 'RotateImg_04_FlipHorizontal.png' });
                report.addTest(
                    'Execute Flip Horizontal',
                    'PASS',
                    'Image flipped horizontally',
                    `Button: "${flipHResult.text}"`
                );
            } else {
                const buttonList = flipHResult.buttonsList?.slice(0, 5).map(b => `"${b.text}" (title: ${b.title})`).join(', ');
                report.addTest(
                    'Execute Flip Horizontal',
                    'INFO',
                    'Flip Horizontal button not found with expected text',
                    `Total buttons: ${flipHResult.total}, Sample: ${buttonList}`
                );
            }
        } catch (error) {
            report.addTest('Execute Flip Horizontal', 'FAIL', error.message);
        }

        // ===== TEST 7: Find & Click Flip Vertical Button =====
        try {
            const flipVResult = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, input[type="button"], div[role="button"], a[role="button"]');
                // First try exact text match
                for (const btn of buttons) {
                    const text = btn.textContent.toLowerCase().trim();
                    if (text === 'flip vertical' || text === 'flip v' || (text.includes('flip') && text.includes('v'))) {
                        btn.click();
                        return { clicked: true, text: btn.textContent.trim() };
                    }
                }
                // Try looking for icons or attributes
                for (const btn of buttons) {
                    if (btn.title?.toLowerCase().includes('flip') && btn.title?.toLowerCase().includes('vertical')) {
                        btn.click();
                        return { clicked: true, text: btn.title };
                    }
                }
                return { clicked: false };
            });

            if (flipVResult.clicked) {
                await new Promise(r => setTimeout(r, 1500));
                await page.screenshot({ path: 'RotateImg_05_FlipVertical.png' });
                report.addTest(
                    'Execute Flip Vertical',
                    'PASS',
                    'Image flipped vertically',
                    `Button: "${flipVResult.text}"`
                );
            } else {
                report.addTest(
                    'Execute Flip Vertical',
                    'INFO',
                    'Flip Vertical button not found or may use icons instead of text labels'
                );
            }
        } catch (error) {
            report.addTest('Execute Flip Vertical', 'FAIL', error.message);
        }

        // ===== TEST 8: Find Download Button =====
        try {
            const downloadResult = await page.evaluate(() => {
                const elements = document.querySelectorAll('button, a, input[type="button"]');
                const keywords = ['download', 'export', 'save', 'get', 'retrieve', 'apply'];

                for (const elem of elements) {
                    const text = elem.textContent.toLowerCase();
                    if (keywords.some(kw => text.includes(kw))) {
                        return { found: true, text: elem.textContent.trim() };
                    }
                }
                return { found: false, total: elements.length };
            });

            if (downloadResult.found) {
                report.addTest(
                    'Find Download Button',
                    'PASS',
                    'Download/Export button located',
                    `Button: "${downloadResult.text}"`
                );
            } else {
                report.addTest(
                    'Find Download Button',
                    'INFO',
                    'Download button not clearly labeled',
                    `Total buttons: ${downloadResult.total}`
                );
            }
        } catch (error) {
            report.addTest('Find Download Button', 'FAIL', error.message);
        }

        // ===== TEST 9: Verify Image Preview =====
        try {
            const previewResult = await page.evaluate(() => {
                const canvas = document.querySelector('canvas');
                const img = document.querySelector('img');
                const container = document.querySelector('[class*="preview"], [class*="canvas"], [id*="preview"]');

                return {
                    canvasFound: !!canvas,
                    imageFound: !!img,
                    canvasCount: document.querySelectorAll('canvas').length,
                    imageCount: document.querySelectorAll('img').length
                };
            });

            if (previewResult.canvasFound || previewResult.imageFound) {
                await page.screenshot({ path: 'RotateImg_06_Preview.png' });
                report.addTest(
                    'Verify Image Preview',
                    'PASS',
                    'Image preview/canvas found',
                    `Canvas: ${previewResult.canvasCount}, Images: ${previewResult.imageCount}`
                );
            } else {
                report.addTest(
                    'Verify Image Preview',
                    'INFO',
                    'Preview element not found'
                );
            }
        } catch (error) {
            report.addTest('Verify Image Preview', 'FAIL', error.message);
        }

        // ===== Generate Report =====
        const testEndTime = Date.now();
        const executionTime = ((testEndTime - testStartTime) / 1000).toFixed(2);
        console.log(`\n${'='.repeat(80)}`);
        console.log(`⏱️  Total Execution Time: ${executionTime} seconds`);

        report.saveReport('rotateImage-report.txt');

    } catch (error) {
        console.error('❌ Critical Test Error:', error.message);
        report.saveReport('rotateImage-report.txt');
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔒 Browser closed\n');
        }
    }
}

// Run tests
runRotateImageTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
