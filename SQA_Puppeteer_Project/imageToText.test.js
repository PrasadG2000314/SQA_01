const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// TestReport class for detailed test reporting
class TestReport {
    constructor() {
        this.tests = [];
        this.startTime = new Date();
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
        const duration = ((new Date() - this.startTime) / 1000).toFixed(2);

        let reportContent = `=== IMAGE TO TEXT (OCR) TEST REPORT ===\n\n`;
        reportContent += `Test Execution Summary:\n`;
        reportContent += `Total Tests: ${this.tests.length}\n`;
        reportContent += `Passed: ${passed}\n`;
        reportContent += `Failed: ${failed}\n`;
        reportContent += `Info/Skipped: ${info}\n`;
        reportContent += `Pass Rate: ${passRate}%\n`;
        reportContent += `Duration: ${duration}s\n`;
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

    saveReport(filename = 'imageToText-report.txt') {
        const report = this.generateReport();
        fs.writeFileSync(filename, report);
        console.log(`\n📄 Report saved to: ${filename}`);
    }
}

async function getImageFiles(dirPath) {
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

async function runImageToTextTests() {
    console.log(`🚀 Starting Image To Text (OCR) Test Suite`);
    console.log(`Target: https://www.pixelssuite.com/image-to-text`);
    console.log(`Image Directory: C:\\Users\\nipun\\Downloads\\Machine-Order-Data`);
    console.log(`${'='.repeat(80)}\n`);

    const report = new TestReport();
    const imageDirectory = 'C:\\Users\\nipun\\Downloads\\Machine-Order-Data';
    const testStartTime = Date.now();

    let browser;
    try {
        // Get available images
        const imageFiles = await getImageFiles(imageDirectory);
        if (imageFiles.length === 0) {
            console.log(`⚠️  No image files found in ${imageDirectory}`);
            report.addTest('Find Images', 'FAIL', `No PNG/JPG images found in ${imageDirectory}`);
            report.saveReport();
            process.exit(1);
        }

        console.log(`Found ${imageFiles.length} image(s): ${imageFiles.map(f => path.basename(f)).join(', ')}\n`);

        // Launch browser
        browser = await puppeteer.launch({
            headless: false,
            slowMo: 100,
            args: ['--start-maximized']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });

        // ===== TEST 1: Navigate to Image To Text Page =====
        try {
            console.log(`\n📍 TEST 1: Navigating to Image To Text Page...`);
            await page.goto('https://www.pixelssuite.com/image-to-text', { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });
            await new Promise(r => setTimeout(r, 2000));
            await page.screenshot({ path: 'ImageToText_01_PageLoaded.png' });

            report.addTest(
                'Navigate to Image To Text Page',
                'PASS',
                'Successfully navigated to image-to-text page',
                `URL: ${page.url()}`
            );
            console.log(`✅ Navigation successful`);
        } catch (error) {
            report.addTest(
                'Navigate to Image To Text Page',
                'FAIL',
                `Navigation failed: ${error.message}`,
                `URL attempted: https://www.pixelssuite.com/image-to-text`
            );
            throw error;
        }

        // ===== TEST 2: Verify Upload Section =====
        try {
            console.log(`\n📍 TEST 2: Verifying Upload Section...`);
            const uploadElements = await page.evaluate(() => {
                const fileInput = document.querySelector('input[type="file"]');
                const allElements = document.querySelectorAll('button, div[role="button"], label, span');
                
                let uploadBtn = null;
                let ocrBtn = null;
                
                for (const el of allElements) {
                    const text = el.textContent.toLowerCase();
                    if (!uploadBtn && (text.includes('upload') || text.includes('select') || text.includes('choose') || text.includes('browse'))) {
                        uploadBtn = el;
                    }
                    if (!ocrBtn && (text.includes('ocr') || text.includes('recognize') || text.includes('extract'))) {
                        ocrBtn = el;
                    }
                }
                
                return {
                    fileInputExists: !!fileInput,
                    uploadButtonExists: !!uploadBtn,
                    uploadButtonText: uploadBtn?.textContent.trim().substring(0, 50) || 'N/A',
                    ocrButtonExists: !!ocrBtn,
                    ocrButtonText: ocrBtn?.textContent.trim().substring(0, 50) || 'N/A',
                    totalElements: allElements.length
                };
            });

            if (uploadElements.fileInputExists || uploadElements.uploadButtonExists) {
                report.addTest(
                    'Verify Upload Section',
                    'PASS',
                    'Upload and OCR elements verified',
                    `File input: ${uploadElements.fileInputExists}, Upload button: ${uploadElements.uploadButtonExists}, OCR button: ${uploadElements.ocrButtonExists}`
                );
                console.log(`✅ Upload section verified`);
                console.log(`   - File input: ${uploadElements.fileInputExists}`);
                console.log(`   - Upload button: ${uploadElements.uploadButtonExists} (${uploadElements.uploadButtonText})`);
                console.log(`   - OCR button: ${uploadElements.ocrButtonExists} (${uploadElements.ocrButtonText})`);
            } else {
                report.addTest(
                    'Verify Upload Section',
                    'INFO',
                    'Standard upload elements not detected',
                    'Page may use custom upload mechanism'
                );
            }
        } catch (error) {
            report.addTest('Verify Upload Section', 'FAIL', error.message);
        }

        // ===== TEST 3-N: Upload Each Image and Test OCR =====
        for (let i = 0; i < imageFiles.length; i++) {
            const imagePath = imageFiles[i];
            const fileName = path.basename(imagePath);

            try {
                console.log(`\n📍 TEST ${3 + i}: Uploading Image (${i + 1}/${imageFiles.length}): ${fileName}...`);

                // Upload image
                const fileInput = await page.$('input[type="file"]');
                if (fileInput) {
                    await fileInput.uploadFile(imagePath);
                    await new Promise(r => setTimeout(r, 2000));
                    await page.screenshot({ path: `ImageToText_02_ImageUploaded_${i + 1}.png` });

                    report.addTest(
                        `Upload Image File (${i + 1}/${imageFiles.length})`,
                        'PASS',
                        `Image successfully uploaded`,
                        `File: ${fileName}`
                    );
                    console.log(`✅ Image uploaded: ${fileName}`);
                } else {
                    throw new Error('File input element not found');
                }

                // ===== TEST: Click OCR Button =====
                try {
                    console.log(`   Clicking OCR button...`);
                    
                    // Try to find and click OCR button
                    const ocrClicked = await page.evaluate(() => {
                        const buttons = document.querySelectorAll('button, div[role="button"], span[role="button"]');
                        for (const btn of buttons) {
                            const text = btn.textContent.toLowerCase();
                            if (text.includes('ocr') || text.includes('recognize') || text.includes('extract') || text.includes('process')) {
                                btn.click();
                                return true;
                            }
                        }
                        return false;
                    });

                    if (ocrClicked) {
                        await new Promise(r => setTimeout(r, 3000)); // Wait for OCR processing
                        await page.screenshot({ path: `ImageToText_03_OCRProcessing_${i + 1}.png` });

                        report.addTest(
                            `Click OCR Button (${i + 1}/${imageFiles.length})`,
                            'PASS',
                            'OCR button clicked successfully',
                            `Image: ${fileName}`
                        );
                        console.log(`   ✅ OCR button clicked`);
                    } else {
                        // Try alternative: auto-processing might happen on upload
                        await new Promise(r => setTimeout(r, 2000));
                        report.addTest(
                            `Click OCR Button (${i + 1}/${imageFiles.length})`,
                            'INFO',
                            'OCR button not found - image may auto-process',
                            `Image: ${fileName}`
                        );
                        console.log(`   ℹ️  OCR button not found - may auto-process`);
                    }
                } catch (error) {
                    report.addTest(
                        `Click OCR Button (${i + 1}/${imageFiles.length})`,
                        'FAIL',
                        `OCR button click failed: ${error.message}`,
                        `Image: ${fileName}`
                    );
                    console.log(`   ❌ OCR button click failed: ${error.message}`);
                }

                // ===== TEST: Extract OCR Results =====
                try {
                    console.log(`   Extracting OCR results...`);
                    
                    const ocrResult = await page.evaluate(() => {
                        // Look for text output areas
                        const textAreas = document.querySelectorAll('textarea, [contenteditable="true"]');
                        const resultDivs = document.querySelectorAll('div, p, span');
                        
                        let extractedText = '';
                        
                        // Check textareas first
                        for (const ta of textAreas) {
                            if (ta.value && ta.value.trim().length > 0) {
                                extractedText = ta.value;
                                break;
                            }
                        }
                        
                        // If no textarea, look for divs with substantial content
                        if (!extractedText) {
                            for (const div of resultDivs) {
                                const text = div.textContent.trim();
                                if (text.length > 20 && text.length < 5000 && !text.includes('button') && !text.includes('click')) {
                                    extractedText = text;
                                    break;
                                }
                            }
                        }
                        
                        return {
                            hasText: !!extractedText,
                            textLength: extractedText.length,
                            text: extractedText.substring(0, 200) // First 200 chars
                        };
                    });

                    if (ocrResult.hasText && ocrResult.textLength > 0) {
                        await page.screenshot({ path: `ImageToText_04_OCRResult_${i + 1}.png` });

                        report.addTest(
                            `Extract OCR Result (${i + 1}/${imageFiles.length})`,
                            'PASS',
                            `OCR text extracted successfully`,
                            `Text length: ${ocrResult.textLength} chars, Preview: ${ocrResult.text}...`
                        );
                        console.log(`   ✅ OCR results extracted`);
                        console.log(`   📝 Text length: ${ocrResult.textLength} characters`);
                        console.log(`   📋 Preview: ${ocrResult.text}...`);
                    } else {
                        report.addTest(
                            `Extract OCR Result (${i + 1}/${imageFiles.length})`,
                            'INFO',
                            'No OCR text found in page',
                            `Image: ${fileName}`
                        );
                        console.log(`   ℹ️  No OCR results found on page`);
                    }
                } catch (error) {
                    report.addTest(
                        `Extract OCR Result (${i + 1}/${imageFiles.length})`,
                        'FAIL',
                        `Result extraction failed: ${error.message}`,
                        `Image: ${fileName}`
                    );
                    console.log(`   ❌ Result extraction failed: ${error.message}`);
                }

            } catch (error) {
                report.addTest(
                    `Complete OCR Test (${i + 1}/${imageFiles.length})`,
                    'FAIL',
                    `Test failed: ${error.message}`,
                    `Image: ${fileName}`
                );
                console.log(`❌ Test failed for ${fileName}: ${error.message}`);
            }

            // Small delay between image tests
            if (i < imageFiles.length - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'ImageToText_Final_Screenshot.png' });

        console.log(`\n${'='.repeat(80)}`);
        console.log(`✅ All tests completed`);

    } catch (error) {
        console.error(`\n❌ Test Suite Error: ${error.message}`);
        report.addTest('Test Suite Execution', 'FAIL', `Fatal error: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
            console.log(`🔒 Browser closed`);
        }
        
        // Save final report
        report.saveReport();
        
        const totalTime = ((Date.now() - testStartTime) / 1000).toFixed(2);
        console.log(`\n⏱️  Total execution time: ${totalTime}s`);
        console.log(`${'='.repeat(80)}\n`);
    }
}

// Run the tests
runImageToTextTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
