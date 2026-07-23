import PDFDocument from 'pdfkit';
import fs from 'fs';

/**
 * Generate PDF report in-memory as a Buffer using PDFKit
 * Completely Vercel-compatible (no disk storage required)
 * @param {Object} param0
 * @param {Object} param0.user Patient user object
 * @param {Object} param0.prediction Prediction document object
 * @param {string|Buffer} [param0.imageSource] Optional image path or Buffer
 * @returns {Promise<Buffer>}
 */
export const generatePredictionReportBuffer = async ({ user, prediction, imageSource }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Title & Header
      doc.fillColor('#0F172A').fontSize(22).text('Oral Health Analysis Report', { align: 'center' });
      doc.fontSize(10).fillColor('#64748B').text(`Generated: ${new Date(prediction.createdAt || Date.now()).toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Prominent Medical Disclaimer Box
      doc.rect(50, doc.y, 512, 45).fillAndStroke('#FEF2F2', '#FCA5A5');
      doc.fillColor('#991B1B').fontSize(9).text(
        'IMPORTANT NOTICE: AI-generated prediction. This result is not a medical diagnosis. Please consult a qualified dental professional for confirmation.',
        60,
        doc.y - 35,
        { width: 492, align: 'center' }
      );
      doc.moveDown(2);

      // Patient Information
      doc.fillColor('#0F172A').fontSize(14).text('Patient Information', { underline: true });
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Name: ${user.name || 'Patient'}`);
      doc.text(`Email: ${user.email || 'N/A'}`);
      if (user.age) doc.text(`Age: ${user.age}`);
      if (user.gender) doc.text(`Gender: ${user.gender}`);
      doc.moveDown();

      // AI Prediction Results
      doc.fillColor('#0F172A').fontSize(14).text('AI Analysis Summary', { underline: true });
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Predicted Condition: ${prediction.displayName || prediction.diseaseName}`);
      doc.text(`Confidence: ${(prediction.confidence || 0).toFixed(1)}%`);

      const riskLevel = prediction.riskLevel || 'LOW';
      const riskColor = riskLevel === 'HIGH' ? '#DC2626' : riskLevel === 'MEDIUM' ? '#D97706' : '#16A34A';
      doc.text('Risk Level: ', { continued: true });
      doc.fillColor(riskColor).text(riskLevel, { continued: false });

      if (prediction.riskReason) {
        doc.fillColor('#334155').text(`Risk Notes: ${prediction.riskReason}`);
      }
      doc.moveDown();

      // Description / Explanation
      if (prediction.description) {
        doc.fillColor('#0F172A').fontSize(14).text('Condition Overview', { underline: true });
        doc.fontSize(10).fillColor('#334155').text(prediction.description);
        doc.moveDown();
      }

      // Embedded Image (if provided)
      if (imageSource) {
        try {
          let imgBuffer = imageSource;
          if (typeof imageSource === 'string' && fs.existsSync(imageSource)) {
            imgBuffer = fs.readFileSync(imageSource);
          }

          if (Buffer.isBuffer(imgBuffer)) {
            doc.fillColor('#0F172A').fontSize(14).text('Analyzed Scan', { underline: true });
            doc.moveDown(0.5);
            doc.image(imgBuffer, { fit: [350, 220], align: 'center' });
            doc.moveDown();
          }
        } catch {
          // If image embedding fails, omit image gracefully without breaking PDF stream
        }
      }

      // Treatment Suggestions
      if (prediction.treatmentSuggestions?.length) {
        doc.fillColor('#0F172A').fontSize(14).text('Treatment Suggestions', { underline: true });
        doc.fontSize(10).fillColor('#334155');
        prediction.treatmentSuggestions.forEach((item) => doc.text(`• ${item}`));
        doc.moveDown();
      }

      // Prevention Tips
      if (prediction.preventionTips?.length) {
        doc.fillColor('#0F172A').fontSize(14).text('Oral Hygiene & Prevention', { underline: true });
        doc.fontSize(10).fillColor('#334155');
        prediction.preventionTips.forEach((item) => doc.text(`• ${item}`));
        doc.moveDown();
      }

      // Recommendations
      if (prediction.recommendation) {
        doc.fillColor('#0F172A').fontSize(14).text('General Recommendation', { underline: true });
        doc.fontSize(10).fillColor('#334155').text(prediction.recommendation);
        doc.moveDown();
      }

      // Footer
      doc.moveDown(1.5);
      doc.fontSize(8).fillColor('#94A3B8').text(
        'Smart Oral Disease Detection System — Powered by MobileNetV3 & AI Medical Assistance',
        { align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Legacy alias for backwards compatibility
export const generatePredictionReport = async (data) => {
  const buffer = await generatePredictionReportBuffer(data);
  return { buffer, fileName: `ai-prediction-report-${data.prediction._id}.pdf` };
};

export default { generatePredictionReportBuffer, generatePredictionReport };
