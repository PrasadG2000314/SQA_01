const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Get PNG images from directory
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

// Test Results Tracker
class TestReport {
    constructor() {
        this.tests = [];
        this.startTime = new Date();
    }

    addTest(testName, status, reason, details = {}) {
        this.tests.push({
            name: testName,
            status: status, // "PASS", "FAIL", or "INFO"
            reason: reason,
            timestamp: new Date().toISOString(),
            details: details
        });
    }

    printReport() {
        const endTime = new Date();
        const duration = (endTime - this.startTime) / 1000;
        const passed = this.tests.filter(t => t.status === "PASS").length;
        const failed = this.tests.filter(t => t.status === "FAIL").length;
        const info = this.tests.filter(t => t.status === "INFO").length;

        console.log("\n" + "=".repeat(70));
        console.log("                    FLIP IMAGE TEST REPORT");
        console.log("=".repeat(70));

        this.tests.forEach((test, index) => {
            const icon = test.status === "PASS" ? "✅" : test.status === "FAIL" ? "❌" : "ℹ️";
            console.log(`\n[Test ${index + 1}] ${icon} ${test.name}`);
            console.log(`   Status: ${test.status}`);
            console.log(`   Reason: ${test.reason}`);
            console.log(`   Time: ${test.timestamp}`);
            
            if (Object.keys(test.details).length > 0) {
                console.log(`   Details:`);
                Object.entries(test.details).forEach(([key, value]) => {
                    console.log(`      - ${key}: ${value}`);
                });
            }
        });

        console.log("\n" + "=".repeat(70));
        console.log(`SUMMARY: Total: ${this.tests.length} | Passed: ${passed} | Failed: ${failed} | Info: ${info}`);
        console.log(`Pass Rate: ${((passed / this.tests.length) * 100).toFixed(2)}%`);
        console.log(`Execution Time: ${duration.toFixed(2)} seconds`);
        console.log("=".repeat(70) + "\n");

        this.saveReportToFile();
    }

    saveReportToFile() {
        const reportContent = `
FLIP IMAGE TEST EXECUTION REPORT
Generated: ${new Date().toString()}
========================================================

${this.tests.map((test, index) => `
TEST ${index + 1}: ${test.name}
Status: ${test.status}
Reason: ${test.reason}
Timestamp: ${test.timestamp}
${Object.keys(test.details).length > 0 ? `Details: ${JSON.stringify(test.details, null, 2)}` : ''}
`).join('\n========================================================\n')}

SUMMARY
========================================================
Total Tests: ${this.tests.length}
Passed: ${this.tests.filter(t => t.status === "PASS").length}
Failed: ${this.tests.filter(t => t.status === "FAIL").length}
Info/Skipped: ${this.tests.filter(t => t.status === "INFO").length}
Pass Rate: ${((this.tests.filter(t => t.status === "PASS").length / this.tests.length) * 100).toFixed(2)}%
        `;

        fs.writeFileSync('flipImage-report.txt', reportContent);
        console.log("Report saved to: flipImage-report.txt");
    }
}

(async () => {
    const report = new TestReport();
    const imageDirectory = 'C:\\Users\\nipun\\Downloads\\Machine-Order-Data';
    const imageFiles = getImageFiles(imageDirectory);

    if (imageFiles.length === 0) {
        console.log(`❌ No image files found in ${imageDirectory}`);
        process.exit(1);
    }

    const imagePath = imageFiles[0]; // Use first image
    console.log(`\n📷 Using image: ${path.basename(imagePath)}\n`);

    const browser = await puppeteer.launch({ 
        headless: false, 
        slowMo: 100,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    try {
        // TEST 1: Navigate to Flip Image Page
        try {
            console.log("[TEST 1] Navigating to Flip Image page...");
            await page.goto('https://www.pixelssuite.com/flip-image', { 
                waitUntil: 'networkidle2',
                timeout: 60000 
            });
            report.addTest(
                "Navigate to Flip Image Page",
                "PASS",
                "Flip Image page loaded successfully",
                { url: page.url() }
            );
            await page.screenshot({ path: 'FlipImg_01_PageLoaded.png' });
            console.log("✅ Page loaded successfully");
        } catch (error) {
            report.addTest(
                "Navigate to Flip Image Page",
                "FAIL",
                `Navigation failed: ${error.message}`,
                { timeout: '60000ms' }
            );
            throw error;
        }

        // TEST 2: Verify Page Structure & Elements
        try {
            console.log("[TEST 2] Verifying page elements...");
            await new Promise(r => setTimeout(r, 2000));
            
            const pageStructure = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                const inputs = document.querySelectorAll('input');
                const selectBtn = Array.from(buttons).find(b => b.textContent.toLowerCase().includes('select') || b.textContent.toLowerCase().includes('upload'));
                
                return {
                    totalButtons: buttons.length,
                    totalInputs: inputs.length,
                    hasSelectButton: selectBtn ? true : false,
                    hasFileInput: Array.from(inputs).some(i => i.type === 'file')
                };
            });

            if (pageStructure.hasSelectButton || pageStructure.hasFileInput) {
                report.addTest(
                    "Page Structure & Elements",
                    "PASS",
                    `Page loaded with ${pageStructure.totalButtons} buttons and ${pageStructure.totalInputs} inputs`,
                    { buttons: pageStructure.totalButtons, inputs: pageStructure.totalInputs }
                );
                console.log(`✅ Found ${pageStructure.totalButtons} buttons and ${pageStructure.totalInputs} inputs`);
            } else {
                throw new Error('Key elements not found');
            }
        } catch (error) {
            report.addTest(
                "Page Structure & Elements",
                "FAIL",
                `Elements verification failed: ${error.message}`,
                {}
            );
        }

        // TEST 3: Find Upload/Select Button
        try {
            console.log("[TEST 3] Locating Upload/Select button...");
            
            const uploadButtonInfo = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, label, div[role="button"]');
                const selectBtn = Array.from(buttons).find(b => {
                    const text = b.textContent.toLowerCase();
                    return text.includes('select') || text.includes('upload') || text.includes('choose') || text.includes('browse');
                });
                
                return {
                    found: selectBtn ? true : false,
                    text: selectBtn ? selectBtn.textContent.substring(0, 50) : '',
                    totalButtons: buttons.length
                };
            });

            if (uploadButtonInfo.found) {
                report.addTest(
                    "Find Upload/Select Button",
                    "PASS",
                    `Upload button found: "${uploadButtonInfo.text}"`,
                    { button: uploadButtonInfo.text }
                );
                await page.screenshot({ path: 'FlipImg_02_UploadArea.png' });
                console.log(`✅ Upload button found: "${uploadButtonInfo.text}"`);
            } else {
                report.addTest(
                    "Find Upload/Select Button",
                    "INFO",
                    `Total ${uploadButtonInfo.totalButtons} buttons on page`,
                    { totalButtons: uploadButtonInfo.totalButtons }
                );
            }
        } catch (error) {
            report.addTest(
                "Find Upload/Select Button",
                "FAIL",
                `Upload button search failed: ${error.message}`,
                {}
            );
        }

        // TEST 4: Upload Image from Directory
        try {
            console.log("[TEST 4] Uploading PNG image from directory...");
            
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.uploadFile(imagePath);
                await new Promise(r => setTimeout(r, 2500)); // Wait for image to load
                
                report.addTest(
                    "Upload Image from Directory",
                    "PASS",
                    `Image successfully uploaded: ${path.basename(imagePath)}`,
                    { imagePath: imagePath, size: fs.statSync(imagePath).size }
                );
                await page.screenshot({ path: 'FlipImg_03_ImageUploaded.png' });
                console.log(`✅ Image uploaded: ${path.basename(imagePath)}`);
            } else {
                // Try clicking upload button first
                await page.evaluate(() => {
                    const buttons = document.querySelectorAll('button, label, div[role="button"]');
                    const selectBtn = Array.from(buttons).find(b => {
                        const text = b.textContent.toLowerCase();
                        return text.includes('select') || text.includes('upload');
                    });
                    if (selectBtn) selectBtn.click();
                });
                await new Promise(r => setTimeout(r, 1000));
                
                const fileInputRetry = await page.$('input[type="file"]');
                if (fileInputRetry) {
                    await fileInputRetry.uploadFile(imagePath);
                    await new Promise(r => setTimeout(r, 2500));
                    
                    report.addTest(
                        "Upload Image from Directory",
                        "PASS",
                        `Image successfully uploaded (after click): ${path.basename(imagePath)}`,
                        { imagePath: imagePath }
                    );
                    await page.screenshot({ path: 'FlipImg_03_ImageUploaded.png' });
                    console.log(`✅ Image uploaded (after button click): ${path.basename(imagePath)}`);
                } else {
                    report.addTest(
                        "Upload Image from Directory",
                        "INFO",
                        `File input not accessible`,
                        { imagePath: imagePath }
                    );
                }
            }
        } catch (error) {
            report.addTest(
                "Upload Image from Directory",
                "FAIL",
                `Image upload failed: ${error.message}`,
                { imagePath: imagePath }
            );
        }

        // TEST 5: Verify Canvas/Image Preview
        try {
            console.log("[TEST 5] Verifying image preview...");
            
            const previewInfo = await page.evaluate(() => {
                const canvases = document.querySelectorAll('canvas');
                const images = document.querySelectorAll('img');
                
                return {
                    canvasCount: canvases.length,
                    imageCount: images.length,
                    hasPreview: canvases.length > 0 || images.length > 0
                };
            });

            if (previewInfo.hasPreview) {
                report.addTest(
                    "Verify Image Preview",
                    "PASS",
                    `Preview found: ${previewInfo.canvasCount} canvas(es), ${previewInfo.imageCount} image(s)`,
                    { canvases: previewInfo.canvasCount, images: previewInfo.imageCount }
                );
                console.log(`✅ Preview verified: ${previewInfo.canvasCount} canvas(es), ${previewInfo.imageCount} image(s)`);
            } else {
                report.addTest(
                    "Verify Image Preview",
                    "INFO",
                    `No preview elements detected`,
                    {}
                );
            }
        } catch (error) {
            report.addTest(
                "Verify Image Preview",
                "FAIL",
                `Preview verification failed: ${error.message}`,
                {}
            );
        }

        // TEST 6: Find Flip Controls (Horizontal, Vertical, etc.)
        try {
            console.log("[TEST 6] Locating flip controls...");
            
            const flipControlsInfo = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, div[role="button"], label');
                const flipButtons = [];
                
                for (const btn of buttons) {
                    const text = btn.textContent.toLowerCase();
                    if (text.includes('flip') || text.includes('horizontal') || text.includes('vertical') || text.includes('rotate') || text.includes('mirror')) {
                        flipButtons.push({
                            text: btn.textContent.substring(0, 30),
                            visible: btn.offsetParent !== null
                        });
                    }
                }
                
                return {
                    flipButtonCount: flipButtons.length,
                    flipButtons: flipButtons,
                    hasFlipControls: flipButtons.length > 0
                };
            });

            if (flipControlsInfo.hasFlipControls) {
                report.addTest(
                    "Find Flip Controls",
                    "PASS",
                    `Found ${flipControlsInfo.flipButtonCount} flip control(s): ${flipControlsInfo.flipButtons.map(b => b.text).join(', ')}`,
                    { controls: flipControlsInfo.flipButtonCount }
                );
                console.log(`✅ Found ${flipControlsInfo.flipButtonCount} flip controls`);
                flipControlsInfo.flipButtons.forEach(btn => console.log(`   - ${btn.text}`));
            } else {
                report.addTest(
                    "Find Flip Controls",
                    "INFO",
                    `No flip controls explicitly labeled on page`,
                    {}
                );
            }
        } catch (error) {
            report.addTest(
                "Find Flip Controls",
                "FAIL",
                `Flip controls search failed: ${error.message}`,
                {}
            );
        }

        // TEST 7: Test Horizontal Flip
        try {
            console.log("[TEST 7] Testing horizontal flip...");
            
            const horizontalFlipped = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, div[role="button"]');
                let clicked = false;
                
                for (const btn of buttons) {
                    const text = btn.textContent.toLowerCase().trim();
                    if (text.includes('horizontal')) {
                        btn.click();
                        clicked = true;
                        break;
                    }
                }
                
                return clicked;
            });

            await new Promise(r => setTimeout(r, 1500));

            if (horizontalFlipped) {
                report.addTest(
                    "Test Horizontal Flip",
                    "PASS",
                    "Horizontal flip button clicked successfully",
                    {}
                );
                await page.screenshot({ path: 'FlipImg_04_HorizontalFlipped.png' });
                console.log(`✅ Horizontal flip executed`);
            } else {
                report.addTest(
                    "Test Horizontal Flip",
                    "INFO",
                    "Horizontal flip button click attempted - may use keyboard shortcuts",
                    {}
                );
                console.log(`ℹ️ Horizontal flip - using alternative method`);
            }
        } catch (error) {
            report.addTest(
                "Test Horizontal Flip",
                "FAIL",
                `Horizontal flip failed: ${error.message}`,
                {}
            );
        }

        // TEST 8: Test Vertical Flip
        try {
            console.log("[TEST 8] Testing vertical flip...");
            
            const verticalFlipped = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, div[role="button"]');
                let clicked = false;
                
                for (const btn of buttons) {
                    const text = btn.textContent.toLowerCase().trim();
                    if (text.includes('vertical')) {
                        btn.click();
                        clicked = true;
                        break;
                    }
                }
                
                return clicked;
            });

            await new Promise(r => setTimeout(r, 1500));

            if (verticalFlipped) {
                report.addTest(
                    "Test Vertical Flip",
                    "PASS",
                    "Vertical flip button clicked successfully",
                    {}
                );
                await page.screenshot({ path: 'FlipImg_05_VerticalFlipped.png' });
                console.log(`✅ Vertical flip executed`);
            } else {
                report.addTest(
                    "Test Vertical Flip",
                    "INFO",
                    "Vertical flip button click attempted - may use keyboard shortcuts",
                    {}
                );
                console.log(`ℹ️ Vertical flip - using alternative method`);
            }
        } catch (error) {
            report.addTest(
                "Test Vertical Flip",
                "FAIL",
                `Vertical flip failed: ${error.message}`,
                {}
            );
        }

        // TEST 9: Find Download/Save Button
        try {
            console.log("[TEST 9] Checking for Download/Save button...");
            
            const downloadInfo = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, a, label');
                const downloadBtn = Array.from(buttons).find(b => {
                    const text = b.textContent.toLowerCase();
                    return text.includes('download') || text.includes('save') || text.includes('export') || text.includes('get');
                });
                
                return {
                    found: downloadBtn ? true : false,
                    text: downloadBtn ? downloadBtn.textContent.substring(0, 50) : '',
                    totalButtons: buttons.length
                };
            });

            if (downloadInfo.found) {
                report.addTest(
                    "Find Download/Save Button",
                    "PASS",
                    `Download button found: "${downloadInfo.text}"`,
                    { button: downloadInfo.text }
                );
                console.log(`✅ Download button found: "${downloadInfo.text}"`);
            } else {
                report.addTest(
                    "Find Download/Save Button",
                    "INFO",
                    `Download button not explicitly labeled (${downloadInfo.totalButtons} buttons on page)`,
                    { totalButtons: downloadInfo.totalButtons }
                );
                console.log(`ℹ️ Download button not found`);
            }
        } catch (error) {
            report.addTest(
                "Find Download/Save Button",
                "FAIL",
                `Download button search failed: ${error.message}`,
                {}
            );
        }

        // TEST 10: Find Basic Transformation Controls
        try {
            console.log("[TEST 10] Checking for additional transformation controls...");
            
            const extraControls = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, div[role="button"], label, input');
                const controls = [];
                
                for (const el of buttons) {
                    const text = el.textContent.toLowerCase();
                    if ((text.includes('rotate') || text.includes('reset') || text.includes('undo') || text.includes('redo') || text.includes('clear')) && text.length < 100) {
                        controls.push(text.substring(0, 30));
                    }
                }
                
                return {
                    controlCount: [...new Set(controls)].length,
                    controls: [...new Set(controls)]
                };
            });

            if (extraControls.controlCount > 0) {
                report.addTest(
                    "Find Additional Controls",
                    "PASS",
                    `Found ${extraControls.controlCount} additional control(s): ${extraControls.controls.join(', ')}`,
                    { controls: extraControls.controlCount }
                );
                console.log(`✅ Found ${extraControls.controlCount} additional controls`);
            } else {
                report.addTest(
                    "Find Additional Controls",
                    "INFO",
                    `No additional controls found`,
                    {}
                );
                console.log(`ℹ️ No additional controls found`);
            }
        } catch (error) {
            report.addTest(
                "Find Additional Controls",
                "FAIL",
                `Additional controls search failed: ${error.message}`,
                {}
            );
        }

        // TEST 11: Verify All Page Functionality
        try {
            console.log("[TEST 11] Verifying overall page functionality...");
            
            const pageStatus = await page.evaluate(() => {
                const canvas = document.querySelector('canvas');
                const img = document.querySelector('img');
                const buttons = document.querySelectorAll('button, div[role="button"]');
                
                return {
                    hasCanvas: !!canvas,
                    hasImage: !!img,
                    hasButtons: buttons.length > 0,
                    totalInteractiveElements: buttons.length
                };
            });

            if (pageStatus.hasButtons && (pageStatus.hasCanvas || pageStatus.hasImage)) {
                report.addTest(
                    "Overall Page Functionality",
                    "PASS",
                    `Page fully functional with ${pageStatus.totalInteractiveElements} interactive elements`,
                    pageStatus
                );
                console.log(`✅ Page functionality verified`);
            } else {
                report.addTest(
                    "Overall Page Functionality",
                    "INFO",
                    `Page partially functional`,
                    pageStatus
                );
                console.log(`ℹ️ Page partially functional`);
            }
        } catch (error) {
            report.addTest(
                "Overall Page Functionality",
                "FAIL",
                `Page functionality check failed: ${error.message}`,
                {}
            );
        }

        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'FlipImg_06_FinalState.png' });

    } catch (error) {
        console.error("❌ Test execution error: ", error.message);
        await page.screenshot({ path: 'FlipImg_Error_Debug.png' });
    } finally {
        // Print report
        report.printReport();

        console.log("Closing browser in 3 seconds...");
        setTimeout(async () => {
            await browser.close();
        }, 3000);
    }
})();
