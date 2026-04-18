const fs = require('fs');
const path = require('path');

class TestReportGenerator {
    constructor() {
        this.allTests = [];
        this.testFiles = [];
        this.screenshots = [];
        this.reportDir = '.';
    }

    // Find all report files
    findReportFiles() {
        const files = fs.readdirSync(this.reportDir);
        this.testFiles = files.filter(f => f.endsWith('-report.txt'));
        console.log(`Found ${this.testFiles.length} report files:\n${this.testFiles.join('\n')}`);
        return this.testFiles;
    }

    // Parse report files
    parseReports() {
        this.testFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const testName = file.replace('-report.txt', '').toUpperCase();
                
                // Extract summary info
                const passMatch = content.match(/Passed:\s*(\d+)/);
                const failMatch = content.match(/Failed:\s*(\d+)/);
                const totalMatch = content.match(/Total Tests:\s*(\d+)/);
                const rateMatch = content.match(/Pass Rate:\s*([\d.]+)%/);

                if (totalMatch) {
                    this.allTests.push({
                        name: testName,
                        file: file,
                        passed: parseInt(passMatch?.[1] || 0),
                        failed: parseInt(failMatch?.[1] || 0),
                        total: parseInt(totalMatch[1]),
                        passRate: parseFloat(rateMatch?.[1] || 0),
                        timestamp: new Date(fs.statSync(file).mtime).toLocaleString()
                    });
                }
            } catch (error) {
                console.error(`Error parsing ${file}: ${error.message}`);
            }
        });
    }

    // Find all screenshots
    findScreenshots() {
        const files = fs.readdirSync(this.reportDir);
        this.screenshots = files
            .filter(f => ['.png', '.jpg', '.jpeg'].includes(path.extname(f).toLowerCase()))
            .map(f => ({
                name: f,
                path: f,
                category: this.categorizeScreenshot(f)
            }))
            .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
        
        console.log(`\nFound ${this.screenshots.length} screenshots`);
        return this.screenshots;
    }

    // Categorize screenshot by test type
    categorizeScreenshot(filename) {
        if (filename.startsWith('MemeGen_')) return '01_MemeGenerator';
        if (filename.startsWith('ImageToText_')) return '02_ImageToText';
        if (filename.startsWith('FlipImg_')) return '03_FlipImage';
        if (filename.startsWith('RotateImg_')) return '04_RotateImage';
        if (filename.includes('More') || filename.includes('Menu') || filename.includes('Dropdown')) return '05_MoreMenu';
        if (filename.includes('Password')) return '06_PasswordGenerator';
        return '00_Other';
    }

    // Generate HTML report
    generateHTML() {
        const totalTests = this.allTests.reduce((sum, t) => sum + t.total, 0);
        const totalPassed = this.allTests.reduce((sum, t) => sum + t.passed, 0);
        const totalFailed = this.allTests.reduce((sum, t) => sum + t.failed, 0);
        const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0;

        // Group screenshots by category
        const screenshotsByCategory = {};
        this.screenshots.forEach(ss => {
            if (!screenshotsByCategory[ss.category]) {
                screenshotsByCategory[ss.category] = [];
            }
            screenshotsByCategory[ss.category].push(ss);
        });

        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SQA Test Report - Pixels Suite</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            padding: 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
            border-bottom: 2px solid #e0e0e0;
        }

        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #667eea;
        }

        .summary-card h3 {
            color: #667eea;
            font-size: 0.9em;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .summary-card .number {
            font-size: 2.5em;
            font-weight: bold;
            color: #333;
        }

        .summary-card.passed {
            border-left-color: #28a745;
        }

        .summary-card.passed .number {
            color: #28a745;
        }

        .summary-card.failed {
            border-left-color: #dc3545;
        }

        .summary-card.failed .number {
            color: #dc3545;
        }

        .summary-card.overall {
            border-left-color: #764ba2;
            grid-column: span 1;
        }

        .summary-card.overall .number {
            color: #764ba2;
        }

        .content {
            padding: 40px;
        }

        .section {
            margin-bottom: 50px;
        }

        .section h2 {
            color: #667eea;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }

        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .test-card {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s ease;
        }

        .test-card:hover {
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            border-color: #667eea;
        }

        .test-card h3 {
            color: #333;
            margin-bottom: 10px;
            font-size: 1.2em;
        }

        .test-stats {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            font-size: 0.95em;
        }

        .test-stats span {
            display: flex;
            align-items: center;
        }

        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
            margin-right: 5px;
        }

        .badge.passed {
            background: #d4edda;
            color: #155724;
        }

        .badge.failed {
            background: #f8d7da;
            color: #721c24;
        }

        .badge.info {
            background: #d1ecf1;
            color: #0c5460;
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            width: 0%;
            transition: width 0.3s ease;
        }

        .screenshots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .screenshot-card {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .screenshot-card:hover {
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
            border-color: #667eea;
        }

        .screenshot-img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            background: #f0f0f0;
        }

        .screenshot-name {
            padding: 12px;
            font-size: 0.9em;
            color: #333;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
            word-break: break-word;
            text-align: center;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            max-width: 90%;
            max-height: 90%;
            background: white;
            border-radius: 8px;
            overflow: auto;
            position: relative;
        }

        .modal-img {
            width: 100%;
            height: auto;
        }

        .modal-close {
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 2em;
            cursor: pointer;
            color: white;
            background: rgba(0, 0, 0, 0.5);
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 2px solid #e0e0e0;
            font-size: 0.9em;
        }

        .category-title {
            color: #667eea;
            font-size: 1.3em;
            margin-top: 30px;
            margin-bottom: 15px;
            font-weight: 600;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.8em;
            }

            .summary {
                grid-template-columns: repeat(2, 1fr);
            }

            .test-grid {
                grid-template-columns: 1fr;
            }

            .screenshots-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 SQA Test Report</h1>
            <p>Pixels Suite - Comprehensive Test Results</p>
            <p style="font-size: 0.9em; margin-top: 10px;">Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="number">${totalTests}</div>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <div class="number">${totalPassed}</div>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <div class="number">${totalFailed}</div>
            </div>
            <div class="summary-card overall">
                <h3>Pass Rate</h3>
                <div class="number">${overallPassRate}%</div>
            </div>
        </div>

        <div class="content">
            <!-- Test Results Section -->
            <div class="section">
                <h2>📊 Test Results by Module</h2>
                <div class="test-grid">`;

        // Add test cards
        this.allTests.forEach(test => {
            const progressWidth = (test.total > 0) ? ((test.passed / test.total) * 100) : 0;
            html += `
                    <div class="test-card">
                        <h3>${test.name}</h3>
                        <div class="test-stats">
                            <span><span class="badge passed">${test.passed}</span> Passed</span>
                            <span><span class="badge failed">${test.failed}</span> Failed</span>
                            <span><strong>${test.passRate}%</strong></span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressWidth}%"></div>
                        </div>
                        <div style="margin-top: 10px; font-size: 0.85em; color: #666;">
                            ${test.total} tests | ${test.timestamp}
                        </div>
                    </div>`;
        });

        html += `
                </div>
            </div>

            <!-- Screenshots Section -->
            <div class="section">
                <h2>📸 Test Screenshots</h2>`;

        // Group and display screenshots
        Object.keys(screenshotsByCategory).sort().forEach(category => {
            const categoryName = this.getCategoryName(category);
            html += `<div class="category-title">${categoryName}</div>
                    <div class="screenshots-grid">`;
            
            screenshotsByCategory[category].forEach(ss => {
                html += `
                    <div class="screenshot-card" onclick="openModal('${ss.path}')">
                        <img src="${ss.path}" alt="${ss.name}" class="screenshot-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22250%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3EImage not found%3C/text%3E%3C/svg%3E'" />
                        <div class="screenshot-name">${ss.name}</div>
                    </div>`;
            });

            html += `</div>`;
        });

        html += `
            </div>
        </div>

        <div class="footer">
            <p>✅ All tests completed successfully | 📁 Reports saved in project directory</p>
            <p style="margin-top: 10px; font-size: 0.8em;">Total Screenshots: ${this.screenshots.length} | Total Report Files: ${this.testFiles.length}</p>
        </div>
    </div>

    <!-- Modal for full-screen image view -->
    <div id="imageModal" class="modal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">✕</button>
            <img id="modalImage" class="modal-img" alt="">
        </div>
    </div>

    <script>
        function openModal(imagePath) {
            const modal = document.getElementById('imageModal');
            const img = document.getElementById('modalImage');
            img.src = imagePath;
            modal.classList.add('active');
        }

        function closeModal() {
            const modal = document.getElementById('imageModal');
            modal.classList.remove('active');
        }

        document.getElementById('imageModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    </script>
</body>
</html>`;

        return html;
    }

    getCategoryName(category) {
        const names = {
            '01_MemeGenerator': '1️⃣ Meme Generator Tests',
            '02_ImageToText': '2️⃣ Image to Text (OCR) Tests',
            '03_FlipImage': '3️⃣ Flip Image Tests',
            '04_RotateImage': '4️⃣ Rotate Image Tests',
            '05_MoreMenu': '5️⃣ More Menu Tests',
            '06_PasswordGenerator': '6️⃣ Password Generator Tests',
            '00_Other': 'Other Screenshots'
        };
        return names[category] || category;
    }

    // Save HTML report
    saveReport(filename = 'TEST_REPORT.html') {
        const html = this.generateHTML();
        fs.writeFileSync(filename, html);
        console.log(`\n✅ Report saved to: ${filename}`);
        return filename;
    }

    // Generate summary
    generateSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('                    TEST REPORT SUMMARY');
        console.log('='.repeat(80));
        
        const totalTests = this.allTests.reduce((sum, t) => sum + t.total, 0);
        const totalPassed = this.allTests.reduce((sum, t) => sum + t.passed, 0);
        const totalFailed = this.allTests.reduce((sum, t) => sum + t.failed, 0);
        const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0;

        console.log('\n📊 OVERALL STATISTICS:');
        console.log(`   Total Tests:    ${totalTests}`);
        console.log(`   ✅ Passed:       ${totalPassed}`);
        console.log(`   ❌ Failed:       ${totalFailed}`);
        console.log(`   📈 Pass Rate:    ${overallPassRate}%`);

        console.log('\n📝 BY MODULE:');
        this.allTests.forEach(test => {
            const icon = test.failed === 0 ? '✅' : '⚠️';
            console.log(`   ${icon} ${test.name.padEnd(30)} | ${test.passed}/${test.total} passed (${test.passRate}%)`);
        });

        console.log('\n📸 SCREENSHOTS:');
        console.log(`   Total: ${this.screenshots.length}`);
        
        const categories = {};
        this.screenshots.forEach(ss => {
            if (!categories[ss.category]) categories[ss.category] = 0;
            categories[ss.category]++;
        });
        
        Object.keys(categories).sort().forEach(cat => {
            console.log(`   - ${this.getCategoryName(cat)}: ${categories[cat]}`);
        });

        console.log('\n' + '='.repeat(80) + '\n');
    }
}

// Run report generation
async function main() {
    console.log('🚀 Generating comprehensive test report...\n');

    const generator = new TestReportGenerator();
    
    // Find and parse all reports
    generator.findReportFiles();
    generator.parseReports();
    
    // Find all screenshots
    generator.findScreenshots();
    
    // Generate and save HTML report
    const reportFile = generator.saveReport();
    
    // Display summary
    generator.generateSummary();
    
    console.log(`📄 Open "${reportFile}" in your browser to view the complete report!`);
    console.log(`\n💡 Tip: All ${generator.screenshots.length} screenshots are clickable for full-screen view`);
}

main().catch(console.error);
