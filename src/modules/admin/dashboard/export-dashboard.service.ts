/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ExportFormat } from '~/common/dto/queryTime.dto';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';

interface ExportDashboardPayload {
    format: ExportFormat;
    data: any;
}

export interface ExportFileResult {
    buffer: Buffer;
    fileName: string;
    contentType: string;
}

interface PaymentStats {
    totalOrders: number;
    paidCount: number;
    pendingCount: number;
    failedCount: number;
    canceledCount: number;
    refundedCount: number;
    totalRevenue: number;
    totalPremiums: number;
    totalAddons: number;
    totalBoth: number;
    others: number;
    paymentPaidRate: number;
}

@Injectable()
export class ExportDashboardService {
    private chartCanvas: ChartJSNodeCanvas;

    constructor() {
        this.chartCanvas = new ChartJSNodeCanvas({
            width: 720,
            height: 320,
            backgroundColour: 'white',
        });
    }

    async exportDashboard(
        payload: ExportDashboardPayload,
    ): Promise<ExportFileResult> {
        const data = this.normalizeDashboardData(payload.data);

        switch (payload.format) {
            case ExportFormat.EXCEL:
                return this.exportExcel(data);
            case ExportFormat.PDF:
                return this.exportPdf(data);
            case ExportFormat.JSON:
                return this.exportJson(data);
            default:
                throw new BadRequestException('Định dạng export không hợp lệ');
        }
    }

    /**
     * API có thể trả theo 2 dạng:
     * - { summary, chartLineData, ... }
     * - { data: { summary, chartLineData, ... } }
     *
     * Sau khi lấy đúng payload, service sẽ tự bù lại các chỉ số payment bị null/0
     * bằng danh sách payments gần đây để tránh Excel/PDF hiện NaN hoặc thống kê sai.
     */
    private normalizeDashboardData(raw: any): any {
        /**
         * API có thể trả nhiều shape khác nhau:
         * - { summary, chartLineData, payments, ... }
         * - { data: { summary, chartLineData, payments, ... } }
         * - { data: { summary, chartLineData, ... }, payments: ... }
         *
         * Case cuối rất dễ làm mất payments nếu chỉ return raw.data.
         */
        const body = raw?.data?.summary
            ? { ...raw.data, payments: raw.data.payments ?? raw.payments }
            : raw?.summary
              ? raw
              : (raw?.data ?? raw ?? {});

        return this.enrichDashboardData(body);
    }

    private enrichDashboardData(data: any): any {
        const payments = this.getPaymentRows(data);
        const stats = this.calculatePaymentStats(
            payments,
            this.getPaymentTotalItems(data),
        );
        const hasPaymentRows = payments.length > 0;

        const summary = { ...(data.summary ?? {}) };
        summary.total_success_payments = this.mergeMetric(
            summary.total_success_payments,
            stats.paidCount,
            hasPaymentRows,
        );
        summary.total_amount = this.mergeMetric(
            summary.total_amount,
            stats.totalRevenue,
            hasPaymentRows,
        );

        const chartPieData = { ...(data.chartPieData ?? {}) };
        const currentCombos = this.firstDefined(
            chartPieData.totalCombos,
            chartPieData.totalBoth,
        );
        const currentOthers = this.firstDefined(
            chartPieData.totalOthers,
            chartPieData.others,
        );

        chartPieData.totalRevenues = this.pickNumber(
            chartPieData.totalRevenues,
            stats.totalRevenue,
            hasPaymentRows,
        );
        chartPieData.totalPremiums = this.pickNumber(
            chartPieData.totalPremiums,
            stats.totalPremiums,
            hasPaymentRows,
        );
        chartPieData.totalAddons = this.pickNumber(
            chartPieData.totalAddons,
            stats.totalAddons,
            hasPaymentRows,
        );
        chartPieData.totalCombos = this.pickNumber(
            currentCombos,
            stats.totalBoth,
            hasPaymentRows,
        );
        chartPieData.totalBoth = chartPieData.totalCombos;
        chartPieData.totalOthers = this.pickNumber(
            currentOthers,
            stats.others,
            hasPaymentRows,
        );
        chartPieData.others = chartPieData.totalOthers;
        chartPieData.totalOrders = this.pickNumber(
            chartPieData.totalOrders,
            stats.totalOrders,
            hasPaymentRows,
        );

        const chartProgress = { ...(data.chartProgress ?? {}) };
        chartProgress.paymentPaidRate = this.pickNumber(
            chartProgress.paymentPaidRate,
            stats.paymentPaidRate,
            hasPaymentRows,
        );
        chartProgress.pending = this.pickNumber(
            chartProgress.pending,
            stats.pendingCount,
            hasPaymentRows,
        );
        chartProgress.failed = this.pickNumber(
            chartProgress.failed,
            stats.failedCount,
            hasPaymentRows,
        );
        chartProgress.canceled = this.pickNumber(
            chartProgress.canceled,
            stats.canceledCount,
            hasPaymentRows,
        );
        chartProgress.refunded = this.pickNumber(
            chartProgress.refunded,
            stats.refundedCount,
            hasPaymentRows,
        );
        chartProgress.premiumRate = this.safeNumber(
            chartProgress.premiumRate,
            0,
        );

        return {
            ...data,
            summary,
            chartPieData,
            chartProgress,
            /**
             * Ghi đè lại payments bằng danh sách đã chuẩn hóa để các sheet/PDF
             * không còn gặp trường hợp row primitive hoặc nested sai shape.
             */
            payments: {
                ...(data.payments ?? {}),
                normalizedRows: payments,
            },
        };
    }

    private exportJson(data: any): ExportFileResult {
        return {
            buffer: Buffer.from(
                JSON.stringify(
                    {
                        title: 'Báo cáo thống kê hệ thống',
                        generated_at: new Date().toISOString(),
                        data,
                    },
                    null,
                    2,
                ),
                'utf-8',
            ),
            fileName: 'dashboard-report.json',
            contentType: 'application/json',
        };
    }

    // ==================== EXCEL ====================
    private async exportExcel(data: any): Promise<ExportFileResult> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'CvProAI';
        workbook.created = new Date();

        this.addSummarySheet(workbook, data);
        await this.addActivityGrowthSheet(workbook, data);
        this.addRevenueSheet(workbook, data);
        this.addProgressSheet(workbook, data);
        this.addPaymentsSheet(workbook, data);

        const excelBuffer = await workbook.xlsx.writeBuffer();
        const buffer = Buffer.from(excelBuffer as ArrayBuffer);

        return {
            buffer,
            fileName: 'dashboard-report.xlsx',
            contentType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
    }

    // ==================== SHEETS ====================
    private addSummarySheet(workbook: ExcelJS.Workbook, data: any): void {
        const sheet = workbook.addWorksheet('Tổng quan');

        sheet.columns = [
            { header: 'Chỉ số', key: 'label', width: 32 },
            { header: 'Giá trị', key: 'value', width: 22 },
            { header: 'Tăng trưởng (%)', key: 'growth', width: 20 },
        ];

        const summary = data.summary ?? {};

        sheet.addRows([
            {
                label: 'Tổng người dùng',
                value: this.getMetricValue(summary.total_users),
                growth: this.toExcelPercent(summary.total_users),
            },
            {
                label: 'CV đã tạo',
                value: this.getMetricValue(summary.total_cvs),
                growth: this.toExcelPercent(summary.total_cvs),
            },
            {
                label: 'Lượt phân tích AI',
                value: this.getMetricValue(summary.total_aiRuns),
                growth: this.toExcelPercent(summary.total_aiRuns),
            },
            {
                label: 'CV đã export',
                value: this.getMetricValue(summary.total_exports),
                growth: this.toExcelPercent(summary.total_exports),
            },
            {
                label: 'Đơn hàng thành công',
                value: this.getMetricValue(summary.total_success_payments),
                growth: this.toExcelPercent(summary.total_success_payments),
            },
            {
                label: 'Tổng doanh thu',
                value: this.getMetricValue(summary.total_amount),
                growth: this.toExcelPercent(summary.total_amount),
            },
        ]);

        this.styleHeaderRow(sheet);
        this.styleNumberColumn(sheet, 'value', '#,##0');
        this.styleNumberColumn(sheet, 'growth', '0.0%');

        // Doanh thu cần format tiền, còn growth null thì hiển thị "--" thay vì ép thành 0%.
        const revenueRow = sheet.getRow(7);
        revenueRow.getCell('value').numFmt = '#,##0 "₫"';
        if (typeof revenueRow.getCell('growth').value !== 'number') {
            revenueRow.getCell('growth').alignment = { horizontal: 'center' };
        }
    }

    private async addActivityGrowthSheet(
        workbook: ExcelJS.Workbook,
        data: any,
    ): Promise<void> {
        const sheet = workbook.addWorksheet('Tăng trưởng');

        sheet.columns = [
            { header: 'Mốc thời gian', key: 'label', width: 18 },
            { header: 'Từ ngày', key: 'fromDate', width: 18 },
            { header: 'Đến ngày', key: 'toDate', width: 18 },
            { header: 'Người dùng', key: 'users', width: 16 },
            { header: 'Tăng trưởng user (%)', key: 'usersGrowth', width: 22 },
            { header: 'CV', key: 'cvs', width: 16 },
            { header: 'Tăng trưởng CV (%)', key: 'cvsGrowth', width: 22 },
            { header: 'AI Analysis', key: 'aiRuns', width: 16 },
            { header: 'Tăng trưởng AI (%)', key: 'aiRunsGrowth', width: 22 },
        ];

        const rows = Array.isArray(data.chartLineData)
            ? data.chartLineData
            : [];

        rows.forEach((item) => {
            sheet.addRow({
                label: item.label ?? '',
                fromDate: this.formatDateVN(item.fromDate),
                toDate: this.formatDateVN(item.toDate),
                users: this.getMetricValue(item.users),
                usersGrowth: this.toExcelPercent(item.users),
                cvs: this.getMetricValue(item.cvs),
                cvsGrowth: this.toExcelPercent(item.cvs),
                aiRuns: this.getMetricValue(item.aiRuns),
                aiRunsGrowth: this.toExcelPercent(item.aiRuns),
            });
        });

        this.styleHeaderRow(sheet);

        ['users', 'cvs', 'aiRuns'].forEach((key) => {
            this.styleNumberColumn(sheet, key, '#,##0');
        });
        ['usersGrowth', 'cvsGrowth', 'aiRunsGrowth'].forEach((key) => {
            this.styleNumberColumn(sheet, key, '0.0%');
        });

        if (rows.length > 0) {
            const labels = rows.map((item) => item.label ?? '');
            const userValues = rows.map((item) =>
                this.getMetricValue(item.users),
            );
            const cvValues = rows.map((item) => this.getMetricValue(item.cvs));
            const aiValues = rows.map((item) =>
                this.getMetricValue(item.aiRuns),
            );

            const barConfig: ChartConfiguration = {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Người dùng',
                            data: userValues,
                            backgroundColor: 'rgba(66,133,244,0.75)',
                            borderColor: '#4285F4',
                            borderWidth: 1,
                        },
                        {
                            label: 'CV',
                            data: cvValues,
                            backgroundColor: 'rgba(52,168,83,0.75)',
                            borderColor: '#34A853',
                            borderWidth: 1,
                        },
                        {
                            label: 'AI Analysis',
                            data: aiValues,
                            backgroundColor: 'rgba(251,188,4,0.75)',
                            borderColor: '#FBBC04',
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Tăng trưởng hoạt động hệ thống',
                            font: { size: 16 },
                        },
                        legend: {
                            position: 'top',
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0 },
                        },
                    },
                },
            };

            const imageBuffer =
                await this.chartCanvas.renderToBuffer(barConfig);
            const imageId = workbook.addImage({
                buffer: imageBuffer as unknown as ArrayBuffer,
                extension: 'png',
            });

            const imageRow = rows.length + 4;
            sheet.addImage(imageId, {
                tl: { col: 0, row: imageRow },
                ext: { width: 720, height: 320 },
            });
        }
    }

    private addRevenueSheet(workbook: ExcelJS.Workbook, data: any): void {
        const sheet = workbook.addWorksheet('Doanh thu theo gói');

        sheet.columns = [
            { header: 'Loại', key: 'label', width: 36 },
            { header: 'Giá trị', key: 'value', width: 22 },
        ];

        const chartPieData = data.chartPieData ?? {};
        const totalPremiums = this.safeNumber(chartPieData.totalPremiums, 0);
        const totalAddons = this.safeNumber(chartPieData.totalAddons, 0);
        const totalCombos = this.safeNumber(
            this.firstDefined(chartPieData.totalCombos, chartPieData.totalBoth),
            0,
        );
        const totalOthers = this.safeNumber(
            this.firstDefined(chartPieData.totalOthers, chartPieData.others),
            0,
        );

        sheet.addRows([
            {
                label: 'Premium',
                value: totalPremiums,
            },
            {
                label: 'AI Add-on',
                value: totalAddons,
            },
            {
                label: 'Combo Premium + AI Add-on',
                value: totalCombos,
            },
            {
                label: 'Khác',
                value: totalOthers,
            },
        ]);

        sheet.addRow({});
        sheet.addRows([
            {
                label: 'Tổng doanh thu',
                value: this.safeNumber(chartPieData.totalRevenues, 0),
            },
            {
                label: 'Tổng đơn hàng',
                value: this.safeNumber(chartPieData.totalOrders, 0),
            },
        ]);

        this.styleHeaderRow(sheet);

        // Các dòng doanh thu format VND, riêng Tổng đơn hàng là số lượng.
        [2, 3, 4, 5, 7].forEach((rowNumber) => {
            sheet.getRow(rowNumber).getCell('value').numFmt = '#,##0 "₫"';
        });
        sheet.getRow(8).getCell('value').numFmt = '#,##0';

        const lastRow = sheet.lastRow;
        if (lastRow) {
            lastRow.font = { bold: true };
            const prevRow = sheet.getRow(lastRow.number - 1);
            if (prevRow) prevRow.font = { bold: true };
        }
    }

    private addProgressSheet(workbook: ExcelJS.Workbook, data: any): void {
        const sheet = workbook.addWorksheet('Subscription & Payment');

        sheet.columns = [
            { header: 'Chỉ số', key: 'label', width: 35 },
            { header: 'Giá trị', key: 'value', width: 25 },
        ];

        const progress = data.chartProgress ?? {};

        sheet.addRows([
            {
                label: 'Tỷ lệ nâng cấp Premium',
                value: this.percentToRatio(progress.premiumRate),
            },
            {
                label: 'Tỷ lệ thanh toán thành công',
                value: this.percentToRatio(progress.paymentPaidRate),
            },
            {
                label: 'Đơn hàng đang chờ',
                value: this.safeNumber(progress.pending, 0),
            },
            {
                label: 'Thanh toán thất bại',
                value: this.safeNumber(progress.failed, 0),
            },
            {
                label: 'Đơn hàng đã hủy',
                value: this.safeNumber(progress.canceled, 0),
            },
            {
                label: 'Đã hoàn tiền',
                value: this.safeNumber(progress.refunded, 0),
            },
        ]);

        this.styleHeaderRow(sheet);

        const col = sheet.getColumn('value');
        col.eachCell((cell, rowNumber) => {
            if (rowNumber === 1) return;
            if (rowNumber <= 3) {
                cell.numFmt = '0.0%';
            } else {
                cell.numFmt = '#,##0';
            }
        });
    }

    private addPaymentsSheet(workbook: ExcelJS.Workbook, data: any): void {
        const sheet = workbook.addWorksheet('Giao dịch gần đây');

        sheet.columns = [
            { header: 'Mã đơn hàng', key: 'order_code', width: 36 },
            { header: 'Người dùng', key: 'user', width: 42 },
            { header: 'Gói', key: 'package', width: 40 },
            { header: 'Số tiền', key: 'amount', width: 18 },
            { header: 'Trạng thái', key: 'status', width: 20 },
            { header: 'Thời gian', key: 'time', width: 22 },
        ];

        const rows = this.getPaymentRows(data);

        rows.forEach((item) => {
            sheet.addRow({
                order_code: item.order_code ?? '',
                user: this.getUserDisplay(item),
                package: this.getPackageName(item),
                amount: this.getPaymentAmount(item),
                status: this.getStatusLabel(item.status),
                time: this.formatDateTimeVN(this.getPaymentTime(item)),
            });
        });

        this.styleHeaderRow(sheet);
        this.styleNumberColumn(sheet, 'amount', '#,##0');
        // Thời gian đã được format theo Asia/Ho_Chi_Minh để tránh Excel/WPS tự lùi ngày do UTC.
    }

    // ==================== PDF ====================
    private async exportPdf(data: any): Promise<ExportFileResult> {
        const buffer = await new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err: Error) => reject(err));

            this.drawPdfHeader(doc);
            this.drawPdfSummary(doc, data);
            this.drawPdfActivityGrowth(doc, data);
            this.drawPdfRevenue(doc, data);
            this.drawPdfProgress(doc, data);
            this.drawPdfPayments(doc, data);

            doc.end();
        });
        return {
            buffer,
            fileName: 'dashboard-report.pdf',
            contentType: 'application/pdf',
        };
    }

    private drawPdfHeader(doc: PDFDocument): void {
        doc.fontSize(18).text('Báo cáo thống kê hệ thống', {
            align: 'center',
        });
        doc.moveDown(0.5);
        doc.fontSize(10).text(
            `Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}`,
            { align: 'center' },
        );
        doc.moveDown();
    }

    private drawPdfSummary(doc: PDFDocument, data: any): void {
        const summary = data.summary ?? {};
        doc.fontSize(13).text('1. Tổng quan');
        doc.moveDown(0.5);

        const metrics = [
            { label: 'Tổng người dùng', key: 'total_users' },
            { label: 'CV đã tạo', key: 'total_cvs' },
            { label: 'Lượt phân tích AI', key: 'total_aiRuns' },
            { label: 'CV đã export', key: 'total_exports' },
            { label: 'Đơn hàng thành công', key: 'total_success_payments' },
        ];

        metrics.forEach(({ label, key }) => {
            doc.fontSize(10).text(
                `${label}: ${this.getMetricValue(summary[key])} | Tăng trưởng: ${this.formatPercent(this.getMetricGrowth(summary[key]))}`,
            );
        });

        doc.text(
            `Tổng doanh thu: ${this.formatMoney(this.getMetricValue(summary.total_amount))} | Tăng trưởng: ${this.formatPercent(this.getMetricGrowth(summary.total_amount))}`,
        );
        doc.moveDown();
    }

    private drawPdfActivityGrowth(doc: PDFDocument, data: any): void {
        const rows = Array.isArray(data.chartLineData)
            ? data.chartLineData
            : [];
        doc.fontSize(13).text('2. Tăng trưởng hoạt động hệ thống');
        doc.moveDown(0.5);

        if (rows.length === 0) {
            doc.fontSize(10).text('Không có dữ liệu tăng trưởng.');
            doc.moveDown();
            return;
        }

        rows.forEach((item) => {
            doc.fontSize(10).text(
                `${item.label ?? ''}: User ${this.getMetricValue(item.users)}, CV ${this.getMetricValue(item.cvs)}, AI ${this.getMetricValue(item.aiRuns)}`,
            );
        });
        doc.moveDown();
    }

    private drawPdfRevenue(doc: PDFDocument, data: any): void {
        const chartPieData = data.chartPieData ?? {};
        doc.fontSize(13).text('3. Doanh thu theo gói');
        doc.moveDown(0.5);

        doc.fontSize(10).text(
            `Tổng doanh thu: ${this.formatMoney(chartPieData.totalRevenues)}`,
        );
        doc.text(
            `Doanh thu Premium: ${this.formatMoney(chartPieData.totalPremiums)}`,
        );
        doc.text(
            `Doanh thu AI Add-on: ${this.formatMoney(chartPieData.totalAddons)}`,
        );
        doc.text(
            `Doanh thu Combo Premium + AI Add-on: ${this.formatMoney(this.firstDefined(chartPieData.totalCombos, chartPieData.totalBoth))}`,
        );
        doc.text(
            `Doanh thu khác: ${this.formatMoney(this.firstDefined(chartPieData.totalOthers, chartPieData.others))}`,
        );
        doc.text(
            `Tổng đơn hàng: ${this.safeNumber(chartPieData.totalOrders, 0)}`,
        );
        doc.moveDown();
    }

    private drawPdfProgress(doc: PDFDocument, data: any): void {
        const progress = data.chartProgress ?? {};
        doc.fontSize(13).text('4. Subscription & Payment');
        doc.moveDown(0.5);

        doc.fontSize(10).text(
            `Tỷ lệ nâng cấp Premium: ${this.formatPercent(progress.premiumRate)}`,
        );
        doc.text(
            `Tỷ lệ thanh toán thành công: ${this.formatPercent(progress.paymentPaidRate)}`,
        );
        doc.text(`Đơn hàng đang chờ: ${this.safeNumber(progress.pending, 0)}`);
        doc.text(`Thanh toán thất bại: ${this.safeNumber(progress.failed, 0)}`);
        doc.text(`Đơn hàng đã hủy: ${this.safeNumber(progress.canceled, 0)}`);
        doc.text(`Đã hoàn tiền: ${this.safeNumber(progress.refunded, 0)}`);
        doc.moveDown();
    }

    private drawPdfPayments(doc: PDFDocument, data: any): void {
        const rows = this.getPaymentRows(data);
        if (doc.y > 620) doc.addPage();

        doc.fontSize(13).text('5. Giao dịch gần đây');
        doc.moveDown(0.5);

        if (rows.length === 0) {
            doc.fontSize(10).text('Không có giao dịch gần đây.');
            return;
        }

        rows.forEach((item, index) => {
            if (doc.y > 720) doc.addPage();
            doc.fontSize(10).text(`${index + 1}. ${item.order_code ?? ''}`);
            doc.fontSize(9)
                .text(`Người dùng: ${this.getUserDisplay(item)}`)
                .text(`Gói: ${this.getPackageName(item)}`)
                .text(
                    `Số tiền: ${this.formatMoney(this.getPaymentAmount(item))}`,
                )
                .text(`Trạng thái: ${this.getStatusLabel(item.status)}`)
                .text(
                    `Thời gian: ${this.formatDateTime(this.getPaymentTime(item))}`,
                );
            doc.moveDown(0.5);
        });
    }

    // ==================== HELPERS ====================
    private styleHeaderRow(sheet: ExcelJS.Worksheet): void {
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.height = 22;
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1F4E78' },
            };
            cell.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true,
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    private styleNumberColumn(
        sheet: ExcelJS.Worksheet,
        columnKey: string,
        numFmt: string,
    ): void {
        const column = sheet.getColumn(columnKey);
        column.eachCell((cell, rowNumber) => {
            if (rowNumber === 1) return;
            if (typeof cell.value === 'number') {
                cell.numFmt = numFmt;
            }
        });
    }

    private styleDateColumn(
        sheet: ExcelJS.Worksheet,
        columnKey: string,
        numFmt: string,
    ): void {
        const column = sheet.getColumn(columnKey);
        column.eachCell((cell, rowNumber) => {
            if (rowNumber === 1) return;
            if (cell.value instanceof Date) {
                cell.numFmt = numFmt;
            }
        });
    }

    private toPlainData(value: any): any {
        if (!value) return value;

        if (Array.isArray(value)) {
            return value.map((item) => this.toPlainData(item));
        }

        if (typeof value !== 'object') {
            return value;
        }
        if (typeof value.get === 'function') {
            try {
                return this.toPlainData(value.get({ plain: true }));
            } catch {
                // fallback xuống dataValues bên dưới
            }
        }

        if (value.dataValues && typeof value.dataValues === 'object') {
            return this.toPlainData(value.dataValues);
        }

        return value;
    }

    private calculatePaymentStats(rows: any[], totalItems = 0): PaymentStats {
        const paidRows = rows.filter((item) => this.isStatus(item, 'PAID'));
        const totalRevenue = this.sumPayments(paidRows);
        const totalPremiums = this.sumPayments(
            paidRows.filter((item) => this.isSubscriptionOnly(item)),
        );
        const totalAddons = this.sumPayments(
            paidRows.filter((item) => this.isAddonOnly(item)),
        );
        const totalBoth = this.sumPayments(
            paidRows.filter((item) => this.isBothOrder(item)),
        );
        const others = Math.max(
            totalRevenue - totalPremiums - totalAddons - totalBoth,
            0,
        );

        const totalOrders = Math.max(rows.length, totalItems);
        const paidCount = paidRows.length;

        return {
            totalOrders,
            paidCount,
            pendingCount: rows.filter((item) => this.isStatus(item, 'PENDING'))
                .length,
            failedCount: rows.filter((item) => this.isStatus(item, 'FAILED'))
                .length,
            canceledCount: rows.filter((item) =>
                this.isStatus(item, 'CANCELED'),
            ).length,
            refundedCount: rows.filter((item) =>
                this.isStatus(item, 'REFUNDED'),
            ).length,
            totalRevenue,
            totalPremiums,
            totalAddons,
            totalBoth,
            others,
            paymentPaidRate:
                totalOrders > 0 ? (paidCount / totalOrders) * 100 : 0,
        };
    }

    private sumPayments(rows: any[]): number {
        return rows.reduce((sum, item) => sum + this.getPaymentAmount(item), 0);
    }

    private getPaymentAmount(item: any): number {
        const plainItem = this.toPlainData(item);

        return this.safeNumber(
            plainItem?.amount_cents ??
                plainItem?.amountCents ??
                plainItem?.amount ??
                plainItem?.amount_vnd ??
                plainItem?.amountVnd ??
                plainItem?.total_amount ??
                plainItem?.totalAmount,
            0,
        );
    }

    private isStatus(item: any, status: string): boolean {
        const plainItem = this.toPlainData(item);
        return String(plainItem?.status ?? '').toUpperCase() === status;
    }

    private isBothOrder(item: any): boolean {
        const plainItem = this.toPlainData(item);
        const orderType = this.normalizeOrderType(
            plainItem?.order_type ?? plainItem?.orderType,
        );
        return (
            orderType === 'BOTH' ||
            Boolean(plainItem?.plan?.name && plainItem?.addon_package?.name)
        );
    }

    private isSubscriptionOnly(item: any): boolean {
        const plainItem = this.toPlainData(item);
        const orderType = this.normalizeOrderType(
            plainItem?.order_type ?? plainItem?.orderType,
        );
        if (this.isBothOrder(plainItem)) return false;
        return orderType === 'SUBSCRIPTION' || Boolean(plainItem?.plan?.name);
    }

    private isAddonOnly(item: any): boolean {
        const plainItem = this.toPlainData(item);
        const orderType = this.normalizeOrderType(
            plainItem?.order_type ?? plainItem?.orderType,
        );
        if (this.isBothOrder(plainItem)) return false;
        return (
            orderType === 'AI_ADDON' ||
            orderType === 'ADDON' ||
            Boolean(plainItem?.addon_package?.name)
        );
    }

    private getPaymentRows(data: any): any[] {
        const plainData = this.toPlainData(data);
        const candidates = [
            plainData?.payments?.data?.data,
            plainData?.data?.payments?.data?.data,

            plainData?.payments?.data?.rows,
            plainData?.data?.payments?.data?.rows,

            plainData?.payments?.data?.items,
            plainData?.data?.payments?.data?.items,

            plainData?.payments?.rows,
            plainData?.data?.payments?.rows,

            plainData?.payments?.items,
            plainData?.data?.payments?.items,

            plainData?.paymentRows,
            plainData?.data?.paymentRows,

            plainData?.recentPayments,
            plainData?.data?.recentPayments,

            plainData?.recent_payments,
            plainData?.data?.recent_payments,

            plainData?.orders,
            plainData?.data?.orders,

            // normalizedRows để cuối cùng, vì có thể đang là []
            plainData?.payments?.normalizedRows,
            plainData?.data?.payments?.normalizedRows,

            plainData?.payments,
            plainData?.data?.payments,
        ];

        for (const candidate of candidates) {
            const rows = this.normalizePaymentRowsFromCandidate(candidate);
            if (rows.length > 0) return rows;
        }

        return [];
    }

    private normalizePaymentRowsFromCandidate(candidate: any): any[] {
        const plainCandidate = this.toPlainData(candidate);
        const rawRows = this.toArrayLike(plainCandidate);
        if (rawRows.length === 0) return [];

        return rawRows
            .map((row) => this.normalizePaymentRow(row))
            .filter((row): row is any => Boolean(row));
    }

    private toArrayLike(value: any): any[] {
        const plainValue = this.toPlainData(value);
        if (!plainValue) return [];

        if (Array.isArray(plainValue)) {
            return plainValue;
        }

        if (typeof plainValue !== 'object') {
            return [];
        }

        const nestedCandidates = [
            plainValue.data?.data,
            plainValue.data?.rows,
            plainValue.data?.items,
            plainValue.rows,
            plainValue.items,
            plainValue.payments,
            plainValue.normalizedRows,
            plainValue.data,
        ];

        for (const candidate of nestedCandidates) {
            const plainCandidate = this.toPlainData(candidate);
            if (Array.isArray(plainCandidate) && plainCandidate.length > 0) {
                return plainCandidate;
            }
        }

        /**
         * Một số serializer có thể trả object dạng {"0": {...}, "1": {...}}
         * thay vì array. Chỉ convert khi tất cả key là số để tránh lấy nhầm
         * object kiểu { data, meta } thành rows.
         */
        const keys = Object.keys(plainValue);
        if (keys.length > 0 && keys.every((key) => /^\d+$/.test(key))) {
            return keys
                .sort((a, b) => Number(a) - Number(b))
                .map((key) => plainValue[key]);
        }

        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    private normalizePaymentRow(row: any): any | null {
        if (!row) return null;

        const plainRow = this.toPlainData(row);

        if (Array.isArray(plainRow)) {
            const objectCell = plainRow.find((cell) => {
                const plainCell = this.toPlainData(cell);
                return (
                    plainCell &&
                    typeof plainCell === 'object' &&
                    !Array.isArray(plainCell) &&
                    (plainCell.order_code ||
                        plainCell.orderCode ||
                        plainCell.status ||
                        plainCell.user ||
                        plainCell.plan ||
                        plainCell.addon_package ||
                        plainCell.dataValues)
                );
            });
            if (objectCell) return this.normalizePaymentRow(objectCell);

            /**
             * Fallback cho trường hợp backend trả tuple:
             * [order_code, user, package, amount, status, time]
             */
            if (plainRow.length >= 5) {
                const tupleRow = {
                    order_code: plainRow[0],
                    userDisplay: plainRow[1],
                    packageName: plainRow[2],
                    amount_cents: plainRow[3],
                    status: plainRow[4],
                    created_at: plainRow[5],
                };
                return this.normalizePaymentRow(tupleRow);
            }

            return null;
        }

        if (typeof plainRow !== 'object') {
            return null;
        }

        const source = this.toPlainData(
            plainRow.payment && typeof plainRow.payment === 'object'
                ? plainRow.payment
                : plainRow.order && typeof plainRow.order === 'object'
                  ? plainRow.order
                  : plainRow,
        );

        if (!source || typeof source !== 'object') return null;

        const orderCode = this.firstDefined(
            source.order_code,
            source.orderCode,
            source.code,
            source.transaction_code,
            source.transactionCode,
        );
        const status = this.firstDefined(
            source.status,
            source.payment_status,
            source.paymentStatus,
        );
        const amount = this.firstDefined(
            source.amount_cents,
            source.amountCents,
            source.amount,
            source.amount_vnd,
            source.amountVnd,
            source.total_amount,
            source.totalAmount,
        );
        const createdAt = this.firstDefined(
            source.createdAt,
            source.created_at,
            source.time,
            source.createdTime,
        );
        const paidAt = this.firstDefined(source.paid_at, source.paidAt);
        const updatedAt = this.firstDefined(
            source.updatedAt,
            source.updated_at,
        );
        const orderType = this.firstDefined(
            source.order_type,
            source.orderType,
            source.type,
        );

        const user = this.toPlainData(source.user ?? source.customer ?? {});
        const plan = this.toPlainData(
            source.plan ?? source.subscription_plan ?? {},
        );
        const addon = this.toPlainData(
            source.addon_package ?? source.addonPackage ?? source.addon ?? {},
        );

        const normalized = {
            ...source,
            order_code: this.toPlainString(orderCode),
            amount_cents: this.safeNumber(amount, 0),
            status: this.toPlainString(status).toUpperCase(),
            order_type: this.normalizeOrderType(orderType),
            paid_at: paidAt ?? null,
            created_at: createdAt ?? null,
            updated_at: updatedAt ?? null,
            user: {
                full_name: this.toPlainString(
                    user.full_name ??
                        user.fullName ??
                        source.user_full_name ??
                        source.userFullName,
                ),
                email: this.toPlainString(
                    user.email ?? source.user_email ?? source.userEmail,
                ),
            },
            plan: {
                name: this.toPlainString(
                    plan.name ?? source.plan_name ?? source.planName,
                ),
            },
            addon_package: {
                name: this.toPlainString(
                    addon.name ??
                        source.addon_name ??
                        source.addonName ??
                        source.addonPackageName,
                ),
            },
            userDisplay: this.toPlainString(source.userDisplay),
            packageName: this.toPlainString(source.packageName),
        };

        if (!this.hasMeaningfulPaymentData(normalized)) {
            return null;
        }

        return normalized;
    }

    private hasMeaningfulPaymentData(item: any): boolean {
        const knownStatus = [
            'PAID',
            'PENDING',
            'FAILED',
            'CANCELED',
            'REFUNDED',
        ].includes(item.status);

        const orderCodeLooksValid =
            Boolean(item.order_code) &&
            !this.isNumericOnlyString(item.order_code);
        const emailLooksValid = String(item.user?.email ?? '').includes('@');
        const fullNameLooksValid =
            Boolean(item.user?.full_name) &&
            !this.isNumericOnlyString(item.user.full_name);
        const userDisplayLooksValid =
            Boolean(item.userDisplay) &&
            !this.isNumericOnlyString(item.userDisplay);
        const packageLooksValid =
            (Boolean(item.plan?.name) &&
                !this.isNumericOnlyString(item.plan.name)) ||
            (Boolean(item.addon_package?.name) &&
                !this.isNumericOnlyString(item.addon_package.name)) ||
            (Boolean(item.packageName) &&
                !this.isNumericOnlyString(item.packageName));

        return Boolean(
            knownStatus ||
            orderCodeLooksValid ||
            item.amount_cents > 0 ||
            emailLooksValid ||
            fullNameLooksValid ||
            userDisplayLooksValid ||
            packageLooksValid,
        );
    }

    private isNumericOnlyString(value: any): boolean {
        return /^\d+$/.test(String(value ?? '').trim());
    }

    private getPaymentTotalItems(data: any): number {
        const plainData = this.toPlainData(data);
        return this.safeNumber(
            plainData?.payments?.data?.meta?.total_items ??
                plainData?.payments?.meta?.total_items ??
                plainData?.payments?.data?.total_items ??
                plainData?.payments?.total_items ??
                plainData?.data?.payments?.data?.meta?.total_items ??
                plainData?.data?.payments?.meta?.total_items,
            0,
        );
    }

    private normalizeOrderType(orderType: any): string {
        const value = String(orderType ?? '')
            .trim()
            .toUpperCase();
        if (value === 'AI_ADD_ON') return 'AI_ADDON';
        if (value === 'ADD_ON') return 'ADDON';
        return value;
    }

    private firstDefined(...values: any[]): any {
        return values.find((value) => value !== undefined && value !== null);
    }

    private toPlainString(value: any): string {
        if (value === undefined || value === null) return '';
        return String(value);
    }

    private getUserDisplay(item: any): string {
        const plainItem = this.toPlainData(item);
        if (plainItem?.userDisplay) return plainItem.userDisplay;

        const fullName =
            plainItem?.user?.full_name ?? plainItem?.user?.fullName;
        const email = plainItem?.user?.email;
        if (fullName && email) return `${fullName} (${email})`;
        return fullName ?? email ?? '';
    }

    private getPackageName(item: any): string {
        const plainItem = this.toPlainData(item);
        if (plainItem?.packageName) return plainItem.packageName;

        const planName = plainItem?.plan?.name;
        const addonName = plainItem?.addon_package?.name;
        if (planName && addonName) return `${planName} + ${addonName}`;
        return (
            planName ??
            addonName ??
            this.getOrderTypeLabel(plainItem?.order_type)
        );
    }

    private getOrderTypeLabel(orderType: any): string {
        switch (this.normalizeOrderType(orderType)) {
            case 'SUBSCRIPTION':
                return 'Premium';
            case 'AI_ADDON':
            case 'ADDON':
                return 'AI Add-on';
            case 'BOTH':
                return 'Premium + AI Add-on';
            default:
                return '';
        }
    }

    /**
     * Nếu API trả null/NaN hoặc trả 0 trong khi danh sách payments chứng minh có dữ liệu,
     * dùng fallback đã tính lại từ payments.
     */
    private pickNumber(
        current: any,
        fallback: number,
        replaceZeroWhenFallbackAvailable = false,
    ): number {
        const value = this.toFiniteNumberOrNull(current);
        if (value == null) return fallback;
        if (replaceZeroWhenFallbackAvailable && value === 0 && fallback !== 0) {
            return fallback;
        }
        return value;
    }

    private mergeMetric(
        metric: any,
        fallbackValue: number,
        replaceZeroWhenFallbackAvailable = false,
    ): { value: number; growth_percent: number | null } {
        const metricObject =
            metric && typeof metric === 'object'
                ? metric
                : { value: metric, growth_percent: null };

        return {
            ...metricObject,
            value: this.pickNumber(
                metricObject.value,
                fallbackValue,
                replaceZeroWhenFallbackAvailable,
            ),
            // Không ép null thành 0 vì 0% và chưa có dữ liệu so sánh là 2 ý nghĩa khác nhau.
            growth_percent: this.toFiniteNumberOrNull(
                metricObject.growth_percent,
            ),
        };
    }

    private getMetricValue(metric: any): number {
        if (metric && typeof metric === 'object') {
            return this.safeNumber(metric.value, 0);
        }
        return this.safeNumber(metric, 0);
    }

    private getMetricGrowth(metric: any): number | null {
        if (metric && typeof metric === 'object') {
            return this.toFiniteNumberOrNull(metric.growth_percent);
        }
        return this.toFiniteNumberOrNull(metric);
    }

    private toExcelPercent(metric: any): number | string {
        const growth = this.getMetricGrowth(metric);
        return growth == null ? '--' : growth / 100;
    }

    private getStatusLabel(status: string): string {
        switch (String(status ?? '').toUpperCase()) {
            case 'PAID':
                return 'Đã thanh toán';
            case 'PENDING':
                return 'Đang chờ';
            case 'FAILED':
                return 'Thất bại';
            case 'CANCELED':
                return 'Đã hủy';
            case 'REFUNDED':
                return 'Đã hoàn tiền';
            default:
                return status ?? '';
        }
    }

    private getPaymentTime(item: any): any {
        const plainItem = this.toPlainData(item);
        return (
            plainItem?.paid_at ??
            plainItem?.paidAt ??
            plainItem?.createdAt ??
            plainItem?.created_at ??
            plainItem?.updatedAt ??
            plainItem?.updated_at ??
            null
        );
    }

    private safeNumber(value: any, fallback = 0): number {
        const parsed = this.toFiniteNumberOrNull(value);
        return parsed == null ? fallback : parsed;
    }

    private toFiniteNumberOrNull(value: any): number | null {
        if (value == null || value === '') return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private percentToRatio(value: any): number {
        return this.safeNumber(value, 0) / 100;
    }

    private formatMoney(value: any): string {
        const amount = this.safeNumber(value, 0);
        return `${amount.toLocaleString('vi-VN')}đ`;
    }

    private formatPercent(value: any): string {
        const percent = this.toFiniteNumberOrNull(value);
        return percent == null ? '--' : `${percent.toFixed(1)}%`;
    }

    private toExcelDate(value: any): Date | string {
        const date = this.parseDate(value);
        return date ?? '';
    }

    private formatDateVN(value: any): string {
        const date = this.parseDate(value);
        if (!date) return '';
        return new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    }

    private formatDateTime(value: any): string {
        return this.formatDateTimeVN(value);
    }

    private formatDateTimeVN(value: any): string {
        const date = this.parseDate(value);
        if (!date) return '';
        return new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    }

    private parseDate(value: any): Date | null {
        if (!value) return null;
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return date;
    }
}
