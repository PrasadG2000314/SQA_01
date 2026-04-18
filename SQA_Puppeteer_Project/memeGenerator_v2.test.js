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
            status: status, // "PASS" or "FAIL"
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

        console.log("\n" + "=".repeat(70));
        console.log("              MEME GENERATOR TEST REPORT (WITH IMAGE UPLOAD)");
        console.log("=".repeat(70));

        this.tests.forEach((test, index) => {
            const icon = test.status === "PASS" ? "✅" : "❌";
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
        console.log(`SUMMARY: Total: ${this.tests.length} | Passed: ${passed} | Failed: ${failed}`);
        console.log(`Pass Rate: ${((passed / this.tests.length) * 100).toFixed(2)}%`);
        console.log(`Execution Time: ${duration.toFixed(2)} seconds`);
        console.log("=".repeat(70) + "\n");

        this.saveReportToFile();
    }

    saveReportToFile() {
        const reportContent = `
MEME GENERATOR TEST EXECUTION REPORT (WITH IMAGE UPLOAD)
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
Pass Rate: ${((this.tests.filter(t => t.status === "PASS").length / this.tests.length) * 100).toFixed(2)}%
        `;

        fs.writeFileSync('memeGenerator-report.txt', reportContent);
        console.log("Report saved to: memeGenerator-report.txt");
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
        // TEST 1: Navigate to Meme Generator
        try {
            console.log("\n[TEST 1] Navigating to Meme Generator...");
            await page.goto('https://www.pixelssuite.com/meme-generator', { 
                waitUntil: 'networkidle2',
                timeout: 60000 
            });
            report.addTest(
                "Navigate to Meme Generator",
                "PASS",
                "Meme Generator page loaded successfully",
                { url: page.url() }
            );
            await page.screenshot({ path: 'MemeGen_01_PageLoaded.png' });
        } catch (error) {
            report.addTest(
                "Navigate to Meme Generator",
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
                const selectBtn = Array.from(buttons).find(b => b.textContent.includes('Select'));
                
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
                const buttons = document.querySelectorAll('button');
                const selectBtn = Array.from(buttons).find(b => b.textContent.toLowerCase().includes('select'));
                
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
                await page.screenshot({ path: 'MemeGen_02_UploadArea.png' });
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

        // TEST 4: Upload Image from Machine-Order-Data Directory
        try {
            console.log("[TEST 4] Uploading PNG image from directory...");
            
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.uploadFile(imagePath);
                await new Promise(r => setTimeout(r, 2000)); // Wait for image to load
                
                report.addTest(
                    "Upload Image from Directory",
                    "PASS",
                    `Image successfully uploaded: ${path.basename(imagePath)}`,
                    { imagePath: imagePath, size: fs.statSync(imagePath).size }
                );
                await page.screenshot({ path: 'MemeGen_04_ImageUploaded.png' });
            } else {
                // Try clicking upload button first
                await page.evaluate(() => {
                    const buttons = document.querySelectorAll('button');
                    const selectBtn = Array.from(buttons).find(b => b.textContent.toLowerCase().includes('select'));
                    if (selectBtn) selectBtn.click();
                });
                await new Promise(r => setTimeout(r, 1000));
                
                const fileInputRetry = await page.$('input[type="file"]');
                if (fileInputRetry) {
                    await fileInputRetry.uploadFile(imagePath);
                    await new Promise(r => setTimeout(r, 2000));
                    
                    report.addTest(
                        "Upload Image from Directory",
                        "PASS",
                        `Image successfully uploaded (after click): ${path.basename(imagePath)}`,
                        { imagePath: imagePath }
                    );
                    await page.screenshot({ path: 'MemeGen_04_ImageUploaded.png' });
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

        // TEST 5: Find Text Input Fields
        try {
            console.log("[TEST 5] Locating Text input fields...");
            
            const textInputsInfo = await page.evaluate(() => {
                const textInputs = document.querySelectorAll('input[type="text"], textarea');
                
                return {
                    textInputCount: textInputs.length,
                    hasTextInputs: textInputs.length > 0
                };
            });

            if (textInputsInfo.hasTextInputs) {
                report.addTest(
                    "Find Text Input Fields",
                    "PASS",
                    `${textInputsInfo.textInputCount} text input(s) found`,
                    { inputs: textInputsInfo.textInputCount }
                );
            } else {
                report.addTest(
                    "Find Text Input Fields",
                    "INFO",
                    `No text inputs currently visible (may appear after image upload)`,
                    {}
                );
            }
        } catch (error) {
            report.addTest(
                "Find Text Input Fields",
                "FAIL",
                `Text inputs search failed: ${error.message}`,
                {}
            );
        }

        // TEST 6: Enter Text in Available Fields
        try {
            console.log("[TEST 6] Entering sample text...");
            
            const textResult = await page.evaluate(() => {
                const inputs = document.querySelectorAll('input[type="text"], textarea');
                let entriesCount = 0;
                
                if (inputs.length > 0) {
                    inputs[0].focus();
                    inputs[0].value = "TOP TEXT HERE";
                    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                    inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                    entriesCount++;
                }
                
                if (inputs.length > 1) {
                    inputs[1].focus();
                    inputs[1].value = "BOTTOM TEXT HERE";
                    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
                    inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
                    entriesCount++;
                }
                
                return entriesCount;
            });

            await new Promise(r => setTimeout(r, 500));
            
            if (textResult > 0) {
                report.addTest(
                    "Enter Text in Fields",
                    "PASS",
                    `Text entered in ${textResult} field(s)`,
                    { fieldsUpdated: textResult }
                );
               await page.screenshot({ path: 'MemeGen_05_TextEntered.png' });
            } else {
                report.addTest(
                    "Enter Text in Fields",
                    "INFO",
                    `No text inputs available yet`,
                    {}
                );
            }
        } catch (error) {
            report.addTest(
                "Enter Text in Fields",
                "FAIL",
                `Failed to enter text: ${error.message}`,
                {}
            );
        }

        // TEST 7: Find Styling Controls (Font Size, Outline, Padding)
        try {
            console.log("[TEST 7] Locating styling controls...");
            
            const stylingControlsInfo = await page.evaluate(() => {
                const ranges = document.querySelectorAll('input[type="range"]');
                const numbers = document.querySelectorAll('input[type="number"]');
                
                return {
                    rangeInputs: ranges.length,
                    numberInputs: numbers.length,
                    totalControls: ranges.length + numbers.length
                };
            });

            if (stylingControlsInfo.totalControls > 0) {
                report.addTest(
                    "Find Styling Controls",
                    "PASS",
                    `Found ${stylingControlsInfo.rangeInputs} range sliders and ${stylingControlsInfo.numberInputs} number inputs`,
                    { ranges: stylingControlsInfo.rangeInputs, numbers: stylingControlsInfo.numberInputs }
                );
            } else {
                report.addTest(
                    "Find Styling Controls",
                    "INFO",
                    `No styling controls found yet`,
                    {}
                );
            }
        } catch (error) {
            report.addTest(
                "Find Styling Controls",
                "FAIL",
                `Styling controls search failed: ${error.message}`,
                {}
            );
        }

        // TEST 8: Adjust Styling Controls
        try {
            console.log("[TEST 8] Adjusting styling controls (Font Size, Outline, Padding)...");
            
            const adjustmentResult = await page.evaluate(() => {
                const ranges = document.querySelectorAll('input[type="range"]');
                let adjustedCount = 0;
                
                // Adjust Font Size (first range)
                if (ranges.length > 0) {
                    ranges[0].value = '60';
                    ranges[0].dispatchEvent(new Event('input', { bubbles: true }));
                    ranges[0].dispatchEvent(new Event('change', { bubbles: true }));
                    adjustedCount++;
                }
                
                // Adjust Outline (second range)
                if (ranges.length > 1) {
                    ranges[1].value = '30';
                    ranges[1].dispatchEvent(new Event('input', { bubbles: true }));
                    ranges[1].dispatchEvent(new Event('change', { bubbles: true }));
                    adjustedCount++;
                }
                
                // Adjust Padding (third range)
                if (ranges.length > 2) {
                    ranges[2].value = '45';
                    ranges[2].dispatchEvent(new Event('input', { bubbles: true }));
                    ranges[2].dispatchEvent(new Event('change', { bubbles: true }));
                    adjustedCount++;
                }
                
                return adjustedCount;
            });

            await new Promise(r => setTimeout(r, 500));
            
            if (adjustmentResult > 0) {
                report.addTest(
                    "Adjust Styling Controls",
                    "PASS",
                    `${adjustmentResult} styling control(s) adjusted (Font: 60, Outline: 30, Padding: 45)`,
                    { controlsAdjusted: adjustmentResult }
                );
                await page.screenshot({ path: 'MemeGen_06_StylingAdjusted.png' });
            } else {
                report.addTest(
                    "Adjust Styling Controls",
                    "INFO",
                    `No styling controls to adjust`,
                    {}
                );
            }
        } catch (error) {
            report.addTest(
                "Adjust Styling Controls",
                "FAIL",
                `Failed to adjust styling: ${error.message}`,
                {}
            );
        }

        // TEST 9: Check for Download Button
        try {
            console.log("[TEST 9] Checking for Download button...");
            
            const downloadInfo = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, a');
                const downloadBtn = Array.from(buttons).find(b => {
                    const text = b.textContent.toLowerCase();
                    return text.includes('download') || text.includes('save') || text.includes('export');
                });
                
                return {
                    found: downloadBtn ? true : false,
                    text: downloadBtn ? downloadBtn.textContent.substring(0, 50) : '',
                    totalButtons: buttons.length
                };
            });

            if (downloadInfo.found) {
                report.addTest(
                    "Check for Download Button",
                    "PASS",
                    `Download button found: "${downloadInfo.text}"`,
                    { button: downloadInfo.text }
                );
            } else {
                report.addTest(
                    "Check for Download Button",
                    "INFO",
                    `Download button not explicitly labeled (${downloadInfo.totalButtons} buttons on page)`,
                    { totalButtons: downloadInfo.totalButtons }
                );
            }
        } catch (error) {
            report.addTest(
                "Check for Download Button",
                "FAIL",
                `Download button search failed: ${error.message}`,
                {}
            );
        }

        // TEST 10: Verify Meme Preview/Canvas
        try {
            console.log("[TEST 10] Verifying meme preview canvas...");
            
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
                    "Verify Meme Preview",
                    "PASS",
                    `Preview found: ${previewInfo.canvasCount} canvas(es), ${previewInfo.imageCount} image(s)`,
                    { canvases: previewInfo.canvasCount, images: previewInfo.imageCount }
                );
                await page.screenshot({ path: 'MemeGen_07_Preview.png' });
            } else {
                report.addTest(
                    "Verify Meme Preview",
                    "INFO",
                    `Preview elements not detected`,
                    {}
                );
            }
        } catch (error) {
            report.addTest(
                "Verify Meme Preview",
                "FAIL",
                `Preview verification failed: ${error.message}`,
                {}
            );
        }

    } catch (error) {
        console.error("❌ Test execution error: ", error.message);
        await page.screenshot({ path: 'MemeGen_Error_Debug.png' });
    } finally {
        // Print report
        report.printReport();

        console.log("Closing browser in 3 seconds...");
        setTimeout(async () => {
            await browser.close();
        }, 3000);
    }
})();
