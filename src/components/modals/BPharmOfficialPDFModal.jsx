import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Download, FileCheck } from 'lucide-react';
import { fetchBPharmBrandingSettingsFromSupabase, fetchCollegeByIdFromSupabase } from '../../services/supabaseService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import html2pdf from 'html2pdf.js';

const convertUrlToBase64 = async (url) => {
  if (!url) return '';
  if (url.startsWith('data:image')) return url;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return '';
  }
};

export const BPharmOfficialPDFModal = ({ isOpen, onClose, record, student }) => {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [branding, setBranding] = useState(null);
  const [collegeData, setCollegeData] = useState(null);
  const [base64Images, setBase64Images] = useState({ header: '', watermark: '' });

  const printRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      if (!isOpen || !record) return;
      setLoading(true);
      try {
        const colRes = await fetchCollegeByIdFromSupabase(student.college_id);
        if (colRes.success) setCollegeData(colRes.data);

        const brandRes = await fetchBPharmBrandingSettingsFromSupabase(student.college_id);
        if (brandRes.success && brandRes.settings) {
          setBranding(brandRes.settings);
          const [header64, watermark64] = await Promise.all([
            convertUrlToBase64(brandRes.settings.header_image_url),
            convertUrlToBase64(brandRes.settings.watermark_image_url)
          ]);
          setBase64Images({ header: header64, watermark: watermark64 });
        }
      } catch (err) {
        console.error('Error loading PDF dependencies', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isOpen, record, student]);

  if (!isOpen || !record) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const element = printRef.current;
      const opt = {
        margin: [0, 0, 0, 0], // Margin handled via CSS padding
        filename: `${student.roll_number}_${record.master.experiment_title.substring(0, 15).trim()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF Generation failed', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const getGraphData = (tableData, blocks) => {
    const tableBlockId = blocks?.find(b => b.type === 'table')?.id;
    if (!tableBlockId || !tableData || !tableData[tableBlockId]) return [];
    
    return tableData[tableBlockId].map(row => ({
      x: parseFloat(row.values[0]) || 0,
      y: parseFloat(row.values[1]) || 0
    })).sort((a, b) => a.x - b.x);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-indigo-500" /> Official Record Ready
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Verify the format below, then download your college-branded PDF.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 transition-colors">
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-bold text-slate-500">Loading College Branding...</p>
            </div>
          ) : (
            <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl relative text-black overflow-hidden" ref={printRef}>
              
              {/* WATERMARK */}
              {base64Images.watermark && (
                <div 
                  className="absolute inset-0 pointer-events-none z-0 opacity-10 flex items-center justify-center"
                  style={{ backgroundImage: `url(${base64Images.watermark})`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: '60%' }}
                />
              )}

              {/* HEADER */}
              <div className="z-10 relative">
                {base64Images.header ? (
                  <img src={base64Images.header} alt="College Header" className="w-full h-auto object-cover" style={{ maxHeight: '140px' }} />
                ) : (
                  <div className="text-center p-8 border-b-2 border-indigo-600">
                    <h1 className="text-2xl font-black">{collegeData?.name || 'UNIVERSITY RECORDS'}</h1>
                    <p className="text-sm">Department of Pharmacology</p>
                  </div>
                )}
              </div>

              {/* PDF CONTENT BODY */}
              <div className="p-12 z-10 relative space-y-6 text-[11pt] font-serif leading-relaxed">
                
                {/* STUDENT META INFO */}
                <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 flex flex-col space-y-2 font-sans">
                  <div className="flex justify-between font-bold border-b border-slate-200 pb-2">
                    <span className="text-lg">B.PHARM PRACTICAL RECORD</span>
                    <span className="text-indigo-700">EVALUATED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div><strong>Student Name:</strong> {student?.full_name}</div>
                    <div><strong>Roll Number:</strong> {student?.roll_number}</div>
                    <div><strong>Batch / Year:</strong> {record.assignment?.target_batch}</div>
                    <div><strong>Subject:</strong> {record.master?.subject_name}</div>
                    <div><strong>Mode:</strong> {record.assignment?.mode}</div>
                    <div><strong>Date Evaluated:</strong> {new Date(record.graded_at || record.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="text-center mt-6 mb-4">
                  <h2 className="text-xl font-bold uppercase underline underline-offset-4 font-sans tracking-wide">
                    {record.master?.experiment_title}
                  </h2>
                </div>

                {/* BLOCKS */}
                <div className="space-y-6">
                  {record.master?.experiment_content?.map((block) => {
                    // In PDF, hide videos. Keep theory, tables, and graphs.
                    if (block.type === 'media') return null;

                    if (block.type === 'text') {
                      return (
                        <div key={block.id}>
                          {block.heading && <h3 className="font-bold text-lg mb-2 font-sans">{block.heading}</h3>}
                          <p className="whitespace-pre-wrap text-justify">{block.content}</p>
                        </div>
                      );
                    }

                    if (block.type === 'table') {
                      const sData = record.student_answers?.[block.id] || [];
                      return (
                        <div key={block.id} className="my-6">
                          {block.heading && <h3 className="font-bold text-lg mb-2 font-sans">{block.heading}</h3>}
                          <table className="w-full text-left border-collapse border border-slate-400 font-sans text-sm">
                            <thead className="bg-slate-100">
                              <tr>
                                {block.content.map((col, i) => (
                                  <th key={i} className="border border-slate-400 p-2 font-bold">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sData.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {block.content.map((_, cIdx) => (
                                    <td key={cIdx} className="border border-slate-400 p-2">{row.values[cIdx] || '-'}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }

                    if (block.type === 'graph') {
                      const gData = getGraphData(record.student_answers, record.master.experiment_content);
                      return (
                        <div key={block.id} className="my-6 break-inside-avoid">
                          {block.heading && <h3 className="font-bold text-lg mb-2 font-sans">{block.heading}</h3>}
                          <div className="h-[250px] w-full border border-slate-200 p-4 font-sans bg-slate-50 rounded-lg">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={gData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                                <Line type="monotone" dataKey="y" stroke="#000" strokeWidth={2} dot={{ r: 4, fill: '#000' }} isAnimationActive={false} />
                                <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                                <XAxis dataKey="x" label={{ value: block.content?.xAxis, position: 'insideBottom', offset: -10 }} />
                                <YAxis label={{ value: block.content?.yAxis, angle: -90, position: 'insideLeft' }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* SIGNATURE BLOCK */}
                <div className="mt-12 border-t-2 border-black pt-6 break-inside-avoid font-sans">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="text-sm text-slate-500 font-bold mb-1">Preceptor Feedback</div>
                      <div className="italic text-black font-serif border border-slate-300 p-3 bg-slate-50 rounded-md min-h-[60px]">
                        "{record.preceptor_feedback}"
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center border border-slate-300 p-4 bg-slate-50 rounded-md">
                      <div className="text-3xl font-black text-black mb-1">{record.grade}</div>
                      <div className="text-xs text-slate-500 font-bold uppercase">Final Grade Awarded</div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-12 px-8">
                    <div className="text-center">
                      <div className="w-48 border-b border-black mb-2"></div>
                      <span className="font-bold">Student Signature</span>
                    </div>
                    <div className="text-center">
                      <div className="w-48 border-b border-black mb-2 flex justify-center">
                        {/* Auto Signature */}
                        <span style={{ fontFamily: "'Brush Script MT', cursive", fontSize: '24px' }} className="text-indigo-800 absolute -mt-6">E-Signed</span>
                      </div>
                      <span className="font-bold">Preceptor Signature</span>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* FOOTER */}
              <div className="absolute bottom-4 left-0 w-full text-center text-xs text-slate-500 font-sans z-10 px-12">
                <div className="border-t border-slate-300 pt-2">
                  {branding?.footer_text || 'Officially generated by PharmDVerse Student Portal'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleDownload}
            disabled={loading || downloading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black flex items-center gap-2 shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-70"
          >
            {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {downloading ? 'Rendering PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

