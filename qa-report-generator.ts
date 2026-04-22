import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
}

interface ModuleResult {
  moduleName: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
}

interface QAReport {
  timestamp: string;
  totalModules: number;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  successRate: number;
  modules: ModuleResult[];
  performanceMetrics?: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  securityIssues?: string[];
  recommendations: string[];
}

class QAReportGenerator {
  private report: QAReport;

  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      totalModules: 0,
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      successRate: 0,
      modules: [],
      recommendations: [],
    };
  }

  addModule(moduleName: string, tests: TestResult[]): void {
    const passed = tests.filter((t) => t.status === 'PASS').length;
    const failed = tests.filter((t) => t.status === 'FAIL').length;
    const skipped = tests.filter((t) => t.status === 'SKIP').length;

    const moduleResult: ModuleResult = {
      moduleName,
      tests,
      passed,
      failed,
      skipped,
    };

    this.report.modules.push(moduleResult);
    this.report.totalModules++;
    this.report.totalTests += tests.length;
    this.report.totalPassed += passed;
    this.report.totalFailed += failed;
    this.report.totalSkipped += skipped;
  }

  addPerformanceMetrics(metrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number;
  }): void {
    this.report.performanceMetrics = metrics;
  }

  addSecurityIssues(issues: string[]): void {
    this.report.securityIssues = issues;
  }

  addRecommendations(recommendations: string[]): void {
    this.report.recommendations = recommendations;
  }

  finalize(): void {
    this.report.successRate =
      (this.report.totalPassed / this.report.totalTests) * 100;
  }

  generateTextReport(): string {
    let report = '';
    report += '╔════════════════════════════════════════════════════════════════════════════════╗\n';
    report += '║                     KARZ JUICE - QA TEST REPORT                                ║\n';
    report += '╚════════════════════════════════════════════════════════════════════════════════╝\n\n';

    // Header
    report += `📅 Report Generated: ${new Date(this.report.timestamp).toLocaleString()}\n\n`;

    // Summary
    report += '═══════════════════════════════════════════════════════════════════════════════════\n';
    report += '📊 TEST SUMMARY\n';
    report += '═══════════════════════════════════════════════════════════════════════════════════\n\n';

    report += `Total Modules Tested:        ${this.report.totalModules}\n`;
    report += `Total Test Cases:            ${this.report.totalTests}\n`;
    report += `✅ Passed:                   ${this.report.totalPassed}\n`;
    report += `❌ Failed:                   ${this.report.totalFailed}\n`;
    report += `⏭️  Skipped:                  ${this.report.totalSkipped}\n`;
    report += `📈 Success Rate:             ${this.report.successRate.toFixed(2)}%\n\n`;

    // Module Details
    report += '═══════════════════════════════════════════════════════════════════════════════════\n';
    report += '📋 MODULE TEST RESULTS\n';
    report += '═══════════════════════════════════════════════════════════════════════════════════\n\n';

    this.report.modules.forEach((module) => {
      const status =
        module.failed === 0 ? '✅ PASS' : '❌ FAIL';
      report += `${status} | ${module.moduleName}\n`;
      report += `     ├─ Passed: ${module.passed}/${module.tests.length}\n`;
      if (module.failed > 0) {
        report += `     ├─ Failed: ${module.failed}\n`;
        module.tests
          .filter((t) => t.status === 'FAIL')
          .forEach((test) => {
            report += `     │  ├─ ${test.name}: ${test.error}\n`;
          });
      }
      if (module.skipped > 0) {
        report += `     └─ Skipped: ${module.skipped}\n`;
      }
      report += '\n';
    });

    // Performance Metrics
    if (this.report.performanceMetrics) {
      report += '═══════════════════════════════════════════════════════════════════════════════════\n';
      report += '⚡ PERFORMANCE METRICS\n';
      report += '═══════════════════════════════════════════════════════════════════════════════════\n\n';

      const perf = this.report.performanceMetrics;
      report += `Average Response Time:       ${perf.avgResponseTime.toFixed(2)}ms\n`;
      report += `P95 Response Time:           ${perf.p95ResponseTime.toFixed(2)}ms\n`;
      report += `P99 Response Time:           ${perf.p99ResponseTime.toFixed(2)}ms\n`;
      report += `Error Rate:                  ${(perf.errorRate * 100).toFixed(2)}%\n`;
      report += `Throughput:                  ${perf.throughput.toFixed(2)} req/s\n\n`;
    }

    // Security Issues
    if (this.report.securityIssues && this.report.securityIssues.length > 0) {
      report += '═══════════════════════════════════════════════════════════════════════════════════\n';
      report += '🔒 SECURITY ISSUES\n';
      report += '═══════════════════════════════════════════════════════════════════════════════════\n\n';

      this.report.securityIssues.forEach((issue, index) => {
        report += `${index + 1}. ⚠️  ${issue}\n`;
      });
      report += '\n';
    }

    // Recommendations
    if (this.report.recommendations.length > 0) {
      report += '═══════════════════════════════════════════════════════════════════════════════════\n';
      report += '💡 RECOMMENDATIONS\n';
      report += '═══════════════════════════════════════════════════════════════════════════════════\n\n';

      this.report.recommendations.forEach((rec, index) => {
        report += `${index + 1}. 📌 ${rec}\n`;
      });
      report += '\n';
    }

    // Footer
    report += '═══════════════════════════════════════════════════════════════════════════════════\n';
    report += `Status: ${this.report.totalFailed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`;
    report += '═══════════════════════════════════════════════════════════════════════════════════\n';

    return report;
  }

  generateJSONReport(): object {
    return this.report;
  }

  saveReport(outputDir: string = './test-reports'): void {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const textPath = path.join(outputDir, `qa-report-${timestamp}.txt`);
    const jsonPath = path.join(outputDir, `qa-report-${timestamp}.json`);

    fs.writeFileSync(textPath, this.generateTextReport());
    fs.writeFileSync(jsonPath, JSON.stringify(this.generateJSONReport(), null, 2));

    console.log(`\n📄 QA Report saved to:\n   Text: ${textPath}\n   JSON: ${jsonPath}\n`);
  }
}

// Example usage
export function generateSampleReport(): void {
  const generator = new QAReportGenerator();

  // Add module results
  const dashboardTests: TestResult[] = [
    { name: 'Dashboard loads', status: 'PASS', duration: 245 },
    { name: 'KPI cards display', status: 'PASS', duration: 156 },
    { name: 'Charts render', status: 'PASS', duration: 342 },
  ];

  const salesTests: TestResult[] = [
    { name: 'Create product', status: 'PASS', duration: 189 },
    { name: 'Record sale', status: 'PASS', duration: 234 },
    { name: 'Generate receipt', status: 'PASS', duration: 567 },
  ];

  const functionsTests: TestResult[] = [
    { name: 'Create event', status: 'PASS', duration: 312 },
    { name: 'Add client', status: 'PASS', duration: 145 },
    { name: 'Record deposit', status: 'PASS', duration: 198 },
  ];

  const accountsTests: TestResult[] = [
    { name: 'Get chart of accounts', status: 'PASS', duration: 89 },
    { name: 'Check balance', status: 'PASS', duration: 76 },
    { name: 'Verify ledger', status: 'PASS', duration: 234 },
  ];

  const expensesTests: TestResult[] = [
    { name: 'Create expense', status: 'PASS', duration: 167 },
    { name: 'Upload receipt', status: 'PASS', duration: 445 },
    { name: 'Categorize expense', status: 'PASS', duration: 123 },
  ];

  generator.addModule('Dashboard', dashboardTests);
  generator.addModule('Sales', salesTests);
  generator.addModule('Functions', functionsTests);
  generator.addModule('Accounts', accountsTests);
  generator.addModule('Expenses', expensesTests);

  // Add performance metrics
  generator.addPerformanceMetrics({
    avgResponseTime: 234.5,
    p95ResponseTime: 456.2,
    p99ResponseTime: 678.9,
    errorRate: 0.02,
    throughput: 125.4,
  });

  // Add security issues
  generator.addSecurityIssues([
    'SQL injection protection verified',
    'CSRF tokens present on all forms',
    'Session timeout configured to 30 minutes',
  ]);

  // Add recommendations
  generator.addRecommendations([
    'Implement rate limiting on API endpoints to prevent abuse',
    'Add request validation on all POST endpoints',
    'Enable HTTPS enforcement for all pages',
    'Implement automated backup of database daily',
    'Add monitoring and alerting for API response times',
    'Conduct security audit quarterly',
  ]);

  generator.finalize();
  generator.saveReport();
}

export default QAReportGenerator;
