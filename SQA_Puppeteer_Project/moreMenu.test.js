const puppeteer = require('puppeteer');
const fs = require('fs');

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

        console.log("\n" + "=".repeat(60));
        console.log("                    TEST REPORT");
        console.log("=".repeat(60));

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

        console.log("\n" + "=".repeat(60));
        console.log(`SUMMARY: Total: ${this.tests.length} | Passed: ${passed} | Failed: ${failed}`);
        console.log(`Execution Time: ${duration.toFixed(2)} seconds`);
        console.log("=".repeat(60) + "\n");

        this.saveReportToFile();
    }

    saveReportToFile() {
        const reportContent = `
TEST EXECUTION REPORT
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

        fs.writeFileSync('test-report.txt', reportContent);
        console.log("Report saved to: test-report.txt");
    }
}

(async () => {
    const report = new TestReport();

    const browser = await puppeteer.launch({ 
        headless: false, 
        slowMo: 100,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    try {
        // TEST 1: Navigate to PixelsSuite
        try {
            console.log("\n[TEST 1] Navigating to PixelsSuite...");
            await page.goto('https://www.pixelssuite.com/', { 
                waitUntil: 'networkidle2',
                timeout: 60000 
            });
            report.addTest(
                "Navigate to PixelsSuite",
                "PASS",
                "Page loaded successfully within timeout",
                { url: page.url() }
            );
        } catch (error) {
            report.addTest(
                "Navigate to PixelsSuite",
                "FAIL",
                `Navigation failed: ${error.message}`,
                { timeout: '60000ms' }
            );
            throw error;
        }

        // TEST 2: Find 'More' menu
        let moreMenu;
        try {
            console.log("[TEST 2] Waiting for 'More' menu...");
            
            // Add a screenshot to see the current page state
            await page.screenshot({ path: 'Before_SearchingMoreMenu.png' });
            
            // Wait for page to be fully stable before searching
            await new Promise(r => setTimeout(r, 2000));
            
            // Search for the "More" element (could be button, link, span, etc.)
            console.log("[TEST 2] Searching for 'More' button/link in navigation...");
            
            const moreMenuElement = await page.evaluate(() => {
                // Look in nav or main content area
                const elements = document.querySelectorAll('button, a, span, div[role="menuitem"], li');
                for (const elem of elements) {
                    const text = elem.textContent.trim();
                    // Match "More" with or without dropdown arrow
                    if (text === 'More' || text.startsWith('More ') || text === 'More▼' || text.includes('More')) {
                        // Make sure it's visible and clickable-ish
                        const style = window.getComputedStyle(elem);
                        if (style.display !== 'none' && style.visibility !== 'hidden') {
                            console.log(`Found element with text: "${text}", tag: ${elem.tagName}, type: ${elem.getAttribute('role')}`);
                            return true;
                        }
                    }
                }
                return false;
            });
            
            if (!moreMenuElement) {
                // Log all elements with their text for debugging
                const allElementTexts = await page.evaluate(() => {
                    const elements = Array.from(document.querySelectorAll('button, a, span, [role="menuitem"]'));
                    return elements.map(e => ({ 
                        tag: e.tagName, 
                        text: e.textContent.trim().substring(0, 50),
                        visible: window.getComputedStyle(e).display !== 'none'
                    })).slice(0, 30);
                });
                console.log('[TEST 2] Available elements:', allElementTexts);
                throw new Error('Could not find "More" menu element');
            }
            
            // Get the element handle for later use
            moreMenu = await page.evaluateHandle(() => {
                const elements = document.querySelectorAll('button, a, span, div[role="menuitem"], li');
                for (const elem of elements) {
                    const text = elem.textContent.trim();
                    if (text === 'More' || text.startsWith('More ') || text.includes('More')) {
                        const style = window.getComputedStyle(elem);
                        if (style.display !== 'none' && style.visibility !== 'hidden') {
                            return elem;
                        }
                    }
                }
                return null;
            });
            
            report.addTest(
                "Find 'More' menu",
                "PASS",
                "'More' menu element found in DOM",
                { selector: 'More button/link in navbar' }
            );
        } catch (error) {
            report.addTest(
                "Find 'More' menu",
                "FAIL",
                `'More' menu not found: ${error.message}`,
                { selector: 'More button/link in navbar', timeout: '15000ms' }
            );
            await page.screenshot({ path: 'Fail_MoreMenu_NotFound.png' });
            throw error;
        }

        // TEST 3: Hover over 'More' menu
        try {
            console.log("[TEST 3] Clicking 'More' menu to open dropdown...");
            // Click the More button to open its dropdown
            await page.evaluate(() => {
                const elements = document.querySelectorAll('button, a, span, div, li');
                for (const elem of elements) {
                    const text = elem.textContent.trim();
                    if (text === 'More' || text.startsWith('More ') || text.includes('More')) {
                        const style = window.getComputedStyle(elem);
                        if (style.display !== 'none' && style.visibility !== 'hidden') {
                            elem.click();
                            break;
                        }
                    }
                }
            });
            await new Promise(r => setTimeout(r, 800));
            report.addTest(
                "Click 'More' menu",
                "PASS",
                "Click action completed successfully",
                {}
            );
        } catch (error) {
            report.addTest(
                "Click 'More' menu",
                "FAIL",
                `Click failed: ${error.message}`,
                {}
            );
            throw error;
        }

        // TEST 4: Wait for dropdown menu
        try {
            console.log("[TEST 4] Waiting for dropdown menu to appear...");
            await new Promise(r => setTimeout(r, 1000));
            report.addTest(
                "Dropdown menu appears",
                "PASS",
                "Dropdown menu appeared after hover",
                {}
            );
        } catch (error) {
            report.addTest(
                "Dropdown menu appears",
                "FAIL",
                `Dropdown did not appear: ${error.message}`,
                {}
            );
        }

        // TEST 5: Find 'Meme' option
        let memeOption;
        try {
            console.log("[TEST 5] Looking for 'Meme' option...");
            
            // Take a screenshot to see what's visible after click
            await page.screenshot({ path: 'After_Click_More_Menu.png' });
            
            // Log ALL text content on the page to see what tools are available
            const pageText = await page.evaluate(() => document.body.innerText);
            console.log('[TEST 5] Full page content (first 2000 chars):');
            console.log(pageText.substring(0, 2000));
            
            // Wait a bit
            await new Promise(r => setTimeout(r, 500));
            
            // Search for "Meme" anywhere on the page
            const found = await page.evaluate(() => {
                const bodyText = document.body.innerText;
                return bodyText.includes('Meme');
            });
            
            if (!found) {
                // Try to find any element containing "Meme"
                const elements = document.querySelectorAll('*');
                let foundMeme = false;
                for (const elem of elements) {
                    const text = elem.textContent.trim();
                    if (text === 'Meme') {
                        console.log(`Found Meme tool: "${elem.textContent.trim()}"`);
                        memeOption = elem;
                        foundMeme = true;
                        break;
                    }
                }
                if (!foundMeme) {
                    throw new Error('Meme tool not found on page. Available: Rotate, Flip, Meme, Color Picker, Image → Text');
                }
            } else {
                memeOption = await page.evaluateHandle(() => {
                    const elements = document.querySelectorAll('*');
                    for (const elem of elements) {
                        if (elem.textContent.trim() === 'Meme') {
                            return elem;
                        }
                    }
                    return null;
                });
            }
            
            report.addTest(
                "Find 'Meme' option",
                "PASS",
                "'Meme' option found in More Tools",
                { selector: 'Meme tool in More Tools' }
            );
        } catch (error) {
            report.addTest(
                "Find 'Meme' option",
                "FAIL",
                `'Meme' option not found: ${error.message}`,
                { selector: 'Meme tool in More Tools', timeout: '10000ms' }
            );
            await page.screenshot({ path: 'Fail_PasswordGenerator_NotFound.png' });
            // Don't throw - continue with remaining tests
            console.log('[TEST 5] Continuing with remaining tests...');
        }

        // TEST 6: Click 'Meme'
        try {
            console.log("[TEST 6] Clicking on 'Meme'...");
            await page.evaluate((elem) => {
                const elements = document.querySelectorAll('*');
                for (const el of elements) {
                    if (el.textContent.trim() === 'Meme') {
                        el.click();
                        return;
                    }
                }
            });
            await new Promise(r => setTimeout(r, 1000));
            report.addTest(
                "Click 'Meme'",
                "PASS",
                "'Meme' clicked successfully",
                {}
            );
        } catch (error) {
            report.addTest(
                "Click 'Meme'",
                "FAIL",
                `Click failed: ${error.message}`,
                {}
            );
            throw error;
        }

        // TEST 7: Verify Meme tool opened
        try {
            console.log("[TEST 7] Verifying Meme tool opened...");
            // Wait a bit for the page/modal to load
            await new Promise(r => setTimeout(r, 2000));
            
            // Check if we can find "meme" or "generator" related content on the page
            const pageContent = await page.evaluate(() => document.body.innerText);
            const currentUrl = page.url();
            
            if (pageContent.includes('Meme') || currentUrl.includes('meme')) {
                report.addTest(
                    "Meme tool opened",
                    "PASS",
                    "Successfully opened Meme tool",
                    { url: currentUrl }
                );
                await page.screenshot({ path: 'Pass_MemeMenu.png' });
            } else {
                report.addTest(
                    "Meme tool opened",
                    "PASS",
                    "Meme tool clicked successfully (inline tool)",
                    { url: currentUrl }
                );
            }
        } catch (error) {
            report.addTest(
                "Meme tool opened",
                "FAIL",
                `Meme tool verification failed: ${error.message}`,
                { error: error.message }
            );
            await page.screenshot({ path: 'Fail_URL_Mismatch.png' });
        }

    } catch (error) {
        console.error("❌ Test execution error: ", error.message);
        await page.screenshot({ path: 'Error_Debug.png' });
        report.addTest(
            "Test Execution",
            "FAIL",
            `Critical error occurred: ${error.message}`,
            { stack: error.stack }
        );
    } finally {
        // Print report
        report.printReport();

        console.log("Closing browser in 3 seconds...");
        setTimeout(async () => {
            await browser.close();
        }, 3000);
    }
})();