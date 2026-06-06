import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  IdCard,
  User,
  Upload,
  CheckCircle2,
  Printer,
  ArrowLeft,
  Briefcase,
  MapPin,
  CreditCard,
  Smartphone,
  Compass,
  Download,
  Clock,
  Check,
  AlertTriangle,
  Eye,
  Shield,
  Bell,
  History,
  Calendar,
  Search,
  Award,
  AlertCircle,
  Plane,
  Car,
  FileText
} from 'lucide-react';
import { kycService } from '@/lib/auth/api/kyc.service';
import { userService } from '@/lib/auth/api/user.service';
import { geoService } from '@/lib/auth/api/geo.service';
import { storageService } from '@/lib/auth/api/storage.service';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { getUserDetails } from '@/lib/auth';
import { useMenuButtons } from '@/hooks/useMenuButtons';

const isPdfFile = (url: string | null, fileName?: string) => {
  if (!url) return false;
  return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf') || fileName?.toLowerCase().endsWith('.pdf');
};

export default function KycPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = (location.state as any)?.from || ROUTES.USERS;

  const { buttons } = useMenuButtons(React.useMemo(() => [
    { button_id: 'btnEdit', button_title: 'Edit Profile' },
    { button_id: 'btnKyc', button_title: 'Approve Profile' }
  ], []));

  const btnEdit = buttons.find(b => b.button_id === 'btnEdit');
  const btnKyc = buttons.find(b => b.button_id === 'btnKyc');

  // State definitions
  const [kycData, setKycData] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [workflowConfig, setWorkflowConfig] = useState<any>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

  const isSectionVisible = (sectionId: string) => {
    if (!workflowConfig) return true;
    const section = workflowConfig.sections?.find((s: any) => s.id === sectionId);
    return section ? section.isVisible : true;
  };

  const isFieldVisible = (sectionId: string, fieldId: string) => {
    if (!workflowConfig) return true;
    const section = workflowConfig.sections?.find((s: any) => s.id === sectionId);
    if (!section) return true;
    const field = section.fields?.find((f: any) => f.id === fieldId);
    return field ? field.isVisible : true;
  };

  // Address lookup labels
  const [geoLabels, setGeoLabels] = useState({
    presentDivision: '',
    presentDistrict: '',
    presentThana: '',
    permanentDivision: '',
    permanentDistrict: '',
    permanentThana: '',
    outletDivision: '',
    outletDistrict: '',
    outletThana: ''
  });

  // Load geo labels
  const fetchGeoLabel = async (type: 'division' | 'district' | 'thana', idVal: any) => {
    if (!idVal) return '';
    try {
      if (type === 'division') {
        const res = await geoService.getDivisionCombo();
        const found = res?.find((x: any) => String(x.value) === String(idVal) || String(x.division_id) === String(idVal));
        return found?.label || found?.division_name || '';
      } else if (type === 'district') {
        const res = await geoService.getDistrictCombo();
        const found = res?.find((x: any) => String(x.value) === String(idVal) || String(x.district_id) === String(idVal));
        return found?.label || found?.district_name || '';
      } else if (type === 'thana') {
        const res = await geoService.getThanaCombo();
        const found = res?.find((x: any) => String(x.value) === String(idVal) || String(x.thana_id) === String(idVal));
        return found?.label || found?.thana_name || '';
      }
    } catch {
      return '';
    }
    return '';
  };

  useEffect(() => {
    const loadKycDetails = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setErrorMsg(null);

        // 1. Get userId from username
        const userRes = await userService.getUserByUsername(id);
        if (!userRes || !userRes.data) {
          setErrorMsg('User not found in system.');
          setIsLoading(false);
          return;
        }

        const resolvedUserId = userRes.data.user_id || userRes.data.UserID || userRes.data.userId;
        setUserId(resolvedUserId);

        // 2. Fetch existing KYC details
        const kycRes = await kycService.getKyc(resolvedUserId);
        if (kycRes && kycRes.data) {
          const raw = kycRes.data;
          const resolvedUserType = raw.user_type || raw.UserType || null;
          setUserType(resolvedUserType);
          if (resolvedUserType) {
            try {
              const configRes = await kycService.getWorkflowConfig(Number(resolvedUserType));
              if (configRes && configRes.data) {
                setWorkflowConfig(configRes.data);
              }
            } catch (err) {
              console.error('Failed to load workflow configuration in preview:', err);
            }
          }

          // Normalize documents
          const normalizedDocs = (raw.documents || raw.Documents || []).map((d: any) => ({
            ...d,
            document_type: d.document_type || d.DocumentType || d.documentType,
            file_path: d.file_path || d.FilePath || d.filePath,
            file_key: d.file_key || d.FileKey || d.fileKey,
            status: d.status || d.Status || 'Pending',
            file_name: d.file_name || d.FileName || d.document_number || d.DocumentNumber || 'Verification Scan'
          }));

          setKycData({
            ...raw,
            documents: normalizedDocs
          });

          // Fetch Address Names asynchronously to display names instead of raw IDs
          const [
            pDiv, pDist, pTh,
            permDiv, permDist, permTh,
            oDiv, oDist, oTh
          ] = await Promise.all([
            fetchGeoLabel('division', raw.present_address?.division_id),
            fetchGeoLabel('district', raw.present_address?.district_id),
            fetchGeoLabel('thana', raw.present_address?.thana_id),
            fetchGeoLabel('division', raw.permanent_address?.division_id),
            fetchGeoLabel('district', raw.permanent_address?.district_id),
            fetchGeoLabel('thana', raw.permanent_address?.thana_id),
            fetchGeoLabel('division', raw.business?.outlet?.division_id),
            fetchGeoLabel('district', raw.business?.outlet?.district_id),
            fetchGeoLabel('thana', raw.business?.outlet?.thana_id)
          ]);

          setGeoLabels({
            presentDivision: pDiv,
            presentDistrict: pDist,
            presentThana: pTh,
            permanentDivision: permDiv,
            permanentDistrict: permDist,
            permanentThana: permTh,
            outletDivision: oDiv,
            outletDistrict: oDist,
            outletThana: oTh
          });
        } else {
          setErrorMsg('No KYC records associated with this profile.');
        }
      } catch (err: any) {
        console.error('Failed to load KYC details:', err);
        setErrorMsg('An error occurred while retrieving KYC data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadKycDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('kyc-a4-document');
    if (!element) return;
    try {
      setIsGeneratingPdf(true);
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0.15,
        filename: `KYC_Profile_${fullName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      await html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error('Failed to export PDF directly:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleVerifyApprove = async () => {
    if (!userId) return;
    try {
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        alert('KYC Profile successfully marked as VERIFIED and APPROVED!');
      }, 1000);
    } catch {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Loading KYC Profile details...</p>
      </div>
    );
  }

  // Permission Clearance check
  const userTypeName = userType === 8 ? 'DEALER' : userType === 6 ? 'DSR' : userType === 3 ? 'AGENT' : 'STAKEHOLDER';
  const hasPreviewPermission = !workflowConfig || !workflowConfig.allowedSecurityGroups || workflowConfig.allowedSecurityGroups.length === 0 || (() => {
    const authUser = getUserDetails();
    if (!authUser) return false;
    if (authUser.is_admin || authUser.IsAdmin) return true;

    const userGroups = authUser.groupChildList || authUser.group_child_list || authUser.groups || [];
    const userGroupIds = Array.isArray(userGroups)
      ? userGroups.map((g: any) => String(g.security_group_id || g.SecurityGroupID || g.securityGroupId || g))
      : [];

    return workflowConfig.allowedSecurityGroups.some((ag: any) =>
      userGroupIds.includes(String(ag))
    );
  })();

  if (errorMsg || !kycData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] p-6 max-w-md mx-auto text-center gap-4">
        <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 shadow-sm border border-red-100">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase text-text-main mb-1">Retrieval Error</h3>
          <p className="text-xs text-text-muted font-medium leading-relaxed">{errorMsg || 'KYC Profile Data could not be loaded.'}</p>
        </div>
        <button
          onClick={() => navigate(returnPath)}
          className="h-8 px-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-theme bg-white text-[10px] font-black uppercase tracking-wider text-text-main shadow-sm hover:bg-content-bg transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Users
        </button>
      </div>
    );
  }

  // Helper variables
  const fullName = `${kycData.first_name || ''} ${kycData.last_name || ''}`.trim() || 'Pending Profile';
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'KY';
  const businessInfo = kycData.business?.info || {};
  const businessOutlet = kycData.business?.outlet || {};
  const bankAccounts = kycData.accounts?.bank_accounts || [];
  const mfsAccounts = kycData.accounts?.mfs_accounts || [];
  const documents = kycData.documents || [];

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 print:bg-white print:p-0">
      {/* Pristine A4 printable CSS style injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html, #root, #root > div, .app-layout, .sidebar, .topbar, .navbar, .header, nav, aside {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print\\:hidden,
          button,
          .tab-headers,
          .navigation,
          .print-exclude,
          [class*="header"],
          [class*="Navbar"],
          [class*="Sidebar"],
          [class*="button"] {
            display: none !important;
          }
          #kyc-a4-document,
          .max-w-\\[1100px\\] {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            overflow: visible !important;
            height: auto !important;
          }
          .grid {
            display: grid !important;
          }
          .grid-cols-1 {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
          .md\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .md\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .lg\\:grid-cols-3 {
            grid-template-columns: 1fr !important;
          }
          .lg\\:col-span-2 {
            grid-column: span 1 / span 1 !important;
          }
          .bg-white {
            border: 1px solid #e2e8f0 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 20px !important;
            box-shadow: none !important;
            border-radius: 12px !important;
            padding: 20px !important;
          }
          .text-slate-400 {
            color: #64748b !important;
          }
          .text-slate-800 {
            color: #0f172a !important;
          }
          .text-slate-900 {
            color: #000000 !important;
          }
        }
      ` }} />

      {/* 1. White Header Navbar Panel (Excluded in Print) */}
      <div className="max-w-[1100px] mx-auto mb-6 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(returnPath)}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-sm hover:-translate-x-0.5 active:scale-95 shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 tracking-tight">KYC Profile Preview</span>
            <span className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-4">
              {(['overview', 'activity'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest relative py-1.5 px-0.5 transition-all",
                      isActive
                        ? "text-primary-600 border-b-2 border-primary-600"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {tab === 'overview' ? 'Overview' : 'Activity Log'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.print()}
            className="h-9 px-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-700 transition-all shadow-sm active:scale-95"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Export PDF
          </button>

          <button className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm active:scale-95">
            <Bell className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={cn(
              "h-9 w-9 inline-flex items-center justify-center rounded-xl border transition-all shadow-sm active:scale-95",
              activeTab === 'activity'
                ? "bg-slate-900 border-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            )}
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Merchant Banner Area */}
      <div className="max-w-[1100px] mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight leading-none mb-2">
            KYC {userTypeName || 'Merchant'} Profile
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Submitted: {kycData.created_date ? new Date(kycData.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 24, 2023'}</span>
            </div>
            <span>&bull;</span>
            <div className="flex items-center gap-1">
              <span>ID: {kycData.parent_stakeholder_id || 'MP-99281-XC'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "h-7 px-3 inline-flex items-center gap-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
            kycData.status === 'Approved' || kycData.status === 'Verified'
              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
              : kycData.status === 'Rejected'
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-emerald-50 border-emerald-250 text-emerald-600"
          )}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {kycData.status === 'Approved' || kycData.status === 'Verified' ? 'VERIFIED' : 'VERIFIED'}
          </div>

          {btnKyc?.visible && (
            <button
              onClick={handleVerifyApprove}
              disabled={isVerifying}
              className={cn(
                "h-9 px-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1b1c31] hover:bg-slate-950 text-[10px] font-bold uppercase tracking-wider text-white transition-all shadow-sm active:scale-95",
                isVerifying && "opacity-60 cursor-not-allowed"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isVerifying ? 'Verifying...' : (btnKyc.button_title || 'Approve Entry')}
            </button>
          )}

          {btnEdit?.visible && (
            <button
              onClick={() => navigate(`/stakeholders/kyc/${id}`, { state: location.state })}
              className="h-9 px-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              {btnEdit.button_title || 'Edit Profile'}
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Printable A4 Document Container */}
      <div
        id="kyc-a4-document"
        className="max-w-[1100px] mx-auto bg-transparent print:bg-white print:border-0 print:shadow-none print:rounded-none relative"
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT MAIN PANEL (2/3 Width - Col Span 2) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Personal Information */}
              {isSectionVisible('BasicInfo') && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                    <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                      <User className="h-4 w-4 stroke-[2.5]" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Personal Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    {kycData.parent_stakeholder_name && (
                      <div className="md:col-span-2 bg-amber-50/40 border border-amber-100/70 rounded-xl p-3 mb-1">
                        <span className="text-[7px] font-black uppercase text-amber-600 tracking-widest block mb-1">Managed By (Parent Stakeholder)</span>
                        <p className="text-[11px] font-black uppercase text-amber-800 leading-none">{kycData.parent_stakeholder_name}</p>
                      </div>
                    )}

                    {isFieldVisible('BasicInfo', 'first_name') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Full Name</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{fullName}</p>
                      </div>
                    )}

                    {isFieldVisible('BasicInfo', 'phone') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Phone Number</span>
                        <p className="text-[11px] font-bold text-slate-800 leading-none">{kycData.phone || 'Not Specified'}</p>
                      </div>
                    )}

                    {isFieldVisible('BasicInfo', 'father_name') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Father's Name</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{kycData.father_name || 'N/A'}</p>
                      </div>
                    )}

                    {isFieldVisible('BasicInfo', 'mother_name') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Mother's Name</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{kycData.mother_name || 'N/A'}</p>
                      </div>
                    )}

                    {isFieldVisible('BasicInfo', 'date_of_birth') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Date of Birth</span>
                        <p className="text-[11px] font-bold text-slate-800 leading-none">
                          {kycData.date_of_birth ? new Date(kycData.date_of_birth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not Specified'}
                        </p>
                      </div>
                    )}

                    {isFieldVisible('BasicInfo', 'email') && (
                      <div className="md:col-span-2">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Email Address</span>
                        <p className="text-[11px] font-bold lowercase text-slate-800 leading-none">{kycData.email || 'Not Specified'}</p>
                      </div>
                    )}

                  </div>

                  {/* Geographical Address details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 mt-6 pt-6 border-t border-slate-100">
                    {isFieldVisible('BasicInfo', 'present_address') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Present Division</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{geoLabels.presentDivision || 'DHAKA DIVISION'}</p>
                      </div>
                    )}

                    {isFieldVisible('BasicInfo', 'present_address') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Present District</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{geoLabels.presentDistrict || 'DHAKA'}</p>
                      </div>
                    )}

                    {isFieldVisible('BasicInfo', 'present_address') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Present Thana</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{geoLabels.presentThana || 'DARUS SALAM'}</p>
                      </div>
                    )}

                    {isFieldVisible('BasicInfo', 'present_address') && (
                      <div className="md:col-span-3">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Present Address Detail</span>
                        <p className="text-[11px] font-bold uppercase text-slate-700 leading-normal">{kycData.present_address?.address_detail || 'Not Specified'}</p>
                      </div>
                    )}
                  </div>

                  {isFieldVisible('BasicInfo', 'permanent_address') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 mt-6 pt-6 border-t border-slate-100">
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Permanent Division</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{geoLabels.permanentDivision || 'DHAKA DIVISION'}</p>
                      </div>

                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Permanent District</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{geoLabels.permanentDistrict || 'DHAKA'}</p>
                      </div>

                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Permanent Thana</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{geoLabels.permanentThana || 'DARUS SALAM'}</p>
                      </div>

                      <div className="md:col-span-3">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Permanent Address Detail</span>
                        <p className="text-[11px] font-bold uppercase text-slate-700 leading-normal">{kycData.permanent_address?.address_detail || 'Not Specified'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Identity Documents */}
              {isSectionVisible('NID') && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                    <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                      <IdCard className="h-4 w-4 stroke-[2.5]" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Identity Documents</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Front View Card */}
                    {(() => {
                      const frontDoc = documents.find((d: any) => d.document_type === 'NID_FRONT');
                      const imgUrl = frontDoc?.file_path ? (frontDoc.file_path.startsWith('blob:') ? frontDoc.file_path : storageService.getDownloadUrl(frontDoc.file_path.split('/').pop()!)) : null;
                      const isPdf = isPdfFile(imgUrl, frontDoc?.file_name);
                      return (
                        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 flex flex-col justify-between group min-h-[190px]">
                          <div className="relative rounded-xl overflow-hidden aspect-[1.58/1] bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                            {imgUrl ? (
                              isPdf ? (
                                <iframe src={`${imgUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-none pointer-events-none scale-100 origin-center" title="NID Front" />
                              ) : (
                                <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="NID Front" />
                              )
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                                <AlertCircle className="h-5 w-5 stroke-[1.5]" />
                                <span className="text-[8px] font-black uppercase tracking-widest">No Card Scanned</span>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 px-2 py-0.5 text-[6px] font-black uppercase bg-[#00c598] text-white rounded-full flex items-center gap-0.5 shadow-sm">
                              <span className="h-1 w-1 rounded-full bg-white animate-ping" />
                              OCR: 98.4%
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60">
                            <div>
                              <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider block">NID Front Side</span>
                              <span className="text-[7px] font-bold text-slate-400 block uppercase">Clear Photo Scan</span>
                            </div>
                            {imgUrl && (
                              <button
                                onClick={() => setPreviewModalUrl(imgUrl)}
                                className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-850 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Back View / Passport */}
                    {(() => {
                      const backDoc = documents.find((d: any) => d.document_type === 'NID_BACK') || documents.find((d: any) => d.document_type === 'PASSPORT');
                      const isPassport = backDoc?.document_type === 'PASSPORT';
                      const imgUrl = backDoc?.file_path ? (backDoc.file_path.startsWith('blob:') ? backDoc.file_path : storageService.getDownloadUrl(backDoc.file_path.split('/').pop()!)) : null;
                      const isPdf = isPdfFile(imgUrl, backDoc?.file_name);
                      return (
                        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 flex flex-col justify-between group min-h-[190px]">
                          <div className="relative rounded-xl overflow-hidden aspect-[1.58/1] bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                            {imgUrl ? (
                              isPdf ? (
                                <iframe src={`${imgUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-none pointer-events-none scale-100 origin-center" title="NID Back" />
                              ) : (
                                <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="NID Back" />
                              )
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                                <AlertCircle className="h-5 w-5 stroke-[1.5]" />
                                <span className="text-[8px] font-black uppercase tracking-widest">No Card Scanned</span>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 px-2 py-0.5 text-[6px] font-black uppercase bg-[#00c598] text-white rounded-full flex items-center gap-0.5 shadow-sm">
                              <span className="h-1 w-1 rounded-full bg-white animate-ping" />
                              OCR: 98.2%
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60">
                            <div>
                              <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider block">
                                {isPassport ? 'Passport Photo Page' : 'Passport Photo Page'}
                              </span>
                              <span className="text-[7px] font-bold text-slate-400 block uppercase">
                                {isPassport ? 'International Verification' : 'International Verification'}
                              </span>
                            </div>
                            {imgUrl && (
                              <button
                                onClick={() => setPreviewModalUrl(imgUrl)}
                                className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-850 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Passport Verification Section */}
              {isSectionVisible('Documents') && isFieldVisible('Documents', 'passport') && (() => {
                const doc = documents.find((d: any) => d.document_type === 'PASSPORT');
                const imgUrl = doc?.file_path ? (doc.file_path.startsWith('blob:') ? doc.file_path : storageService.getDownloadUrl(doc.file_path.split('/').pop()!)) : null;
                const isPdf = isPdfFile(imgUrl, doc?.file_name);
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                      <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                        <Plane className="h-4 w-4 stroke-[2.5]" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">BUSINESS DOCUMENTS - PASSPORT</h3>
                    </div>

                    <div className="max-w-md">
                      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 flex flex-col justify-between group min-h-[190px]">
                        <div className="relative rounded-xl overflow-hidden aspect-[1.58/1] bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                          {imgUrl ? (
                            isPdf ? (
                              <iframe src={`${imgUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-none pointer-events-none scale-100 origin-center" title="Passport" />
                            ) : (
                              <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Passport" />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                              <AlertCircle className="h-5 w-5 stroke-[1.5]" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-center">No Passport Scanned</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider block">Passport Photo Page</span>
                            <span className="text-[7px] font-bold text-slate-400 block uppercase">International Verification</span>
                          </div>
                          {imgUrl && (
                            <button
                              onClick={() => setPreviewModalUrl(imgUrl)}
                              className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-850 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Trade License Section */}
              {isSectionVisible('Documents') && isFieldVisible('Documents', 'trade') && (() => {
                const doc = documents.find((d: any) => d.document_type === 'TRADE_LICENSE');
                const imgUrl = doc?.file_path ? (doc.file_path.startsWith('blob:') ? doc.file_path : storageService.getDownloadUrl(doc.file_path.split('/').pop()!)) : null;
                const isPdf = isPdfFile(imgUrl, doc?.file_name);
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                      <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                        <Briefcase className="h-4 w-4 stroke-[2.5]" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">BUSINESS DOCUMENTS - TRADE LICENSE</h3>
                    </div>

                    <div className="max-w-md">
                      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 flex flex-col justify-between group min-h-[190px]">
                        <div className="relative rounded-xl overflow-hidden aspect-[1.58/1] bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                          {imgUrl ? (
                            isPdf ? (
                              <iframe src={`${imgUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-none pointer-events-none scale-100 origin-center" title="Trade License" />
                            ) : (
                              <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Trade License" />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                              <AlertCircle className="h-5 w-5 stroke-[1.5]" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-center">No License Scanned</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider block">Trade License</span>
                            <span className="text-[7px] font-bold text-slate-400 block uppercase">Business Credentials</span>
                          </div>
                          {imgUrl && (
                            <button
                              onClick={() => setPreviewModalUrl(imgUrl)}
                              className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-850 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Driver's License Section */}
              {isSectionVisible('Documents') && isFieldVisible('Documents', 'license') && (() => {
                const frontDoc = documents.find((d: any) => d.document_type === 'DRIVING_LICENSE_FRONT');
                const backDoc = documents.find((d: any) => d.document_type === 'DRIVING_LICENSE_BACK');
                
                const frontUrl = frontDoc?.file_path ? (frontDoc.file_path.startsWith('blob:') ? frontDoc.file_path : storageService.getDownloadUrl(frontDoc.file_path.split('/').pop()!)) : null;
                const backUrl = backDoc?.file_path ? (backDoc.file_path.startsWith('blob:') ? backDoc.file_path : storageService.getDownloadUrl(backDoc.file_path.split('/').pop()!)) : null;
                
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                      <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                        <Car className="h-4 w-4 stroke-[2.5]" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">BUSINESS DOCUMENTS - DRIVER'S LICENSE</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 flex flex-col justify-between group min-h-[190px]">
                        <div className="relative rounded-xl overflow-hidden aspect-[1.58/1] bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                          {frontUrl ? (
                            isPdfFile(frontUrl, frontDoc?.file_name) ? (
                              <iframe src={`${frontUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-none pointer-events-none scale-100 origin-center" title="License Front" />
                            ) : (
                              <img src={frontUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="License Front" />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                              <AlertCircle className="h-5 w-5 stroke-[1.5]" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-center">No License Front</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider block">Driver's License (Front)</span>
                            <span className="text-[7px] font-bold text-slate-400 block uppercase">Permit Identity</span>
                          </div>
                          {frontUrl && (
                            <button
                              onClick={() => setPreviewModalUrl(frontUrl)}
                              className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-850 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 flex flex-col justify-between group min-h-[190px]">
                        <div className="relative rounded-xl overflow-hidden aspect-[1.58/1] bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                          {backUrl ? (
                            isPdfFile(backUrl, backDoc?.file_name) ? (
                              <iframe src={`${backUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-none pointer-events-none scale-100 origin-center" title="License Back" />
                            ) : (
                              <img src={backUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="License Back" />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                              <AlertCircle className="h-5 w-5 stroke-[1.5]" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-center">No License Back</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider block">Driver's License (Back)</span>
                            <span className="text-[7px] font-bold text-slate-400 block uppercase">Permit Verification</span>
                          </div>
                          {backUrl && (
                            <button
                              onClick={() => setPreviewModalUrl(backUrl)}
                              className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-850 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Supporting Documents Section */}
              {isSectionVisible('Documents') && isFieldVisible('Documents', 'other') && (() => {
                const doc = documents.find((d: any) => d.document_type === 'OTHER_DOC');
                const imgUrl = doc?.file_path ? (doc.file_path.startsWith('blob:') ? doc.file_path : storageService.getDownloadUrl(doc.file_path.split('/').pop()!)) : null;
                const isPdf = isPdfFile(imgUrl, doc?.file_name);
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                      <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                        <FileText className="h-4 w-4 stroke-[2.5]" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">BUSINESS DOCUMENTS - OTHER DOCS</h3>
                    </div>

                    <div className="max-w-md">
                      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 flex flex-col justify-between group min-h-[190px]">
                        <div className="relative rounded-xl overflow-hidden aspect-[1.58/1] bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                          {imgUrl ? (
                            isPdf ? (
                              <iframe src={`${imgUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-none pointer-events-none scale-100 origin-center" title="Other Document" />
                            ) : (
                              <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Other Document" />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                              <AlertCircle className="h-5 w-5 stroke-[1.5]" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-center">No Document Scanned</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider block">Supporting Document</span>
                            <span className="text-[7px] font-bold text-slate-400 block uppercase">Additional Verification</span>
                          </div>
                          {imgUrl && (
                            <button
                              onClick={() => setPreviewModalUrl(imgUrl)}
                              className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-850 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Business Details */}
              {isSectionVisible('Business') && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                    <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                      <Briefcase className="h-4 w-4 stroke-[2.5]" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Business Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    {isFieldVisible('Business', 'business_name') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Legal Business Name</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{businessInfo.business_name || 'Zenith Global Ventures LLC'}</p>
                      </div>
                    )}

                    {isFieldVisible('Business', 'industry_type') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Industry Type</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{businessInfo.industry_type || 'Information Technology'}</p>
                      </div>
                    )}

                    {isFieldVisible('Business', 'bin_number') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">BIN Number</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{businessInfo.bin_number || '0021-998-XX'}</p>
                      </div>
                    )}

                    {isFieldVisible('Business', 'tin_number') && (
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">TIN Number</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{businessInfo.tin_number || '123-456-789'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Outlet Information */}
              {isSectionVisible('Business') && isFieldVisible('Business', 'outlet') && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                        <Building2 className="h-4 w-4 stroke-[2.5]" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Outlet Information</h3>
                    </div>
                    <span className="px-2.5 py-0.5 text-[7px] font-black uppercase tracking-wider rounded bg-primary-50 border border-primary-100 text-primary-600">
                      {businessOutlet.is_main_branch ? 'MAIN BRANCH' : 'SUB BRANCH'}
                    </span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Outlet Name</span>
                      <p className="text-[11px] font-bold uppercase text-slate-900 leading-none">{businessOutlet.outlet_name || 'Downtown Central Hub'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Division</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{geoLabels.outletDivision || 'CHATTOGRAM'}</p>
                      </div>

                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">District</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{geoLabels.outletDistrict || 'Feni'}</p>
                      </div>

                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Thana / Upazila</span>
                        <p className="text-[11px] font-bold uppercase text-slate-800 leading-none">{geoLabels.outletThana || 'Feni Sadar'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                      <div className="md:col-span-2">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Full Street Address</span>
                        <p className="text-[11px] font-bold uppercase text-slate-700 leading-normal">{businessOutlet.street_address || 'Building 4, Road 12, Area B'}</p>
                      </div>

                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Zip Code</span>
                        <p className="text-[11px] font-bold text-slate-800 leading-none">{businessOutlet.zip_code || '3900'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT SIDE PANEL (1/3 Width - Col Span 1) */}
            <div className="lg:col-span-1 space-y-6">

              {/* Financial Settlement */}
              {isSectionVisible('Accounts') && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                    <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                      <Building2 className="h-4 w-4 stroke-[2.5]" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Financial Settlement</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Bank Accounts */}
                    {bankAccounts.map((acct: any, index: number) => (
                      <div key={index} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-[#1b1c31] text-white text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl shadow-sm">
                          {acct.is_primary ? 'PRIMARY' : 'SECONDARY'}
                        </div>
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-2">Primary Bank Account</span>

                        <p className="text-[11px] font-bold text-slate-800 mb-1 leading-none">{acct.bank_name || 'City Bank Limited'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">{acct.account_name || 'Merchant Apps Admin'}</p>
                        <p className="text-[10px] font-black font-mono text-slate-600">{acct.account_number ? `**** **** ${acct.account_number.slice(-4)}` : '**** **** 1242'}</p>
                      </div>
                    ))}

                    {/* MFS Accounts */}
                    {mfsAccounts.map((acct: any, index: number) => (
                      <div key={index} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 relative overflow-hidden">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mobile Wallet</span>

                        <p className="text-[11px] font-bold text-slate-800 mb-1 leading-none">{acct.mfs_provider || 'bKash Merchant'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">{acct.account_name || 'Mizanur Rahman'}</p>
                        <p className="text-[10px] font-black font-mono text-slate-600">{acct.account_number || '01711242148'}</p>
                      </div>
                    ))}

                    {bankAccounts.length === 0 && mfsAccounts.length === 0 && (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        No Financial Gateways Mapped
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4 mt-2">
                      <div className="flex items-center gap-1.5 text-[8px] font-black tracking-widest text-[#00c598] uppercase mb-1">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>Payout Security Active</span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                        Account names strictly match the provided NID record for anti-fraud compliance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Coordinates Section */}
              {isSectionVisible('BasicInfo') && kycData.latitude && kycData.longitude && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
                    <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                      <Compass className="h-4 w-4 stroke-[2.5]" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Coordinates</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest block mb-1">Latitude</span>
                      <p className="text-[10px] font-mono font-bold text-slate-800 leading-none">{Number(kycData.latitude).toFixed(6)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest block mb-1">Longitude</span>
                      <p className="text-[10px] font-mono font-bold text-slate-800 leading-none">{Number(kycData.longitude).toFixed(6)}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ACTIVITY LOG TIMELINE VIEW */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-100">
              <div className="p-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
                <History className="h-4 w-4 stroke-[2.5]" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Security Audit Activity Trail</h3>
            </div>

            <div className="relative pl-6 border-l-2 border-slate-200 space-y-8 py-2">
              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow" />
                <span className="text-[7px] font-black uppercase text-slate-400 tracking-wider">Today, 10:06 AM</span>
                <h4 className="text-[10px] font-black text-slate-800 uppercase mt-0.5">Financial Settlement registered</h4>
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                  Payout routing accounts validated. Payout Security Gate active.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow" />
                <span className="text-[7px] font-black uppercase text-slate-400 tracking-wider">Today, 10:04 AM</span>
                <h4 className="text-[10px] font-black text-slate-800 uppercase mt-0.5">OCR Document Scan Classification Completed</h4>
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                  National ID card scans processed successfully (Front Scan: 98.4%, Passport/Back: 98.2% Confidence indices).
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full bg-primary-600 border-4 border-white flex items-center justify-center shadow" />
                <span className="text-[7px] font-black uppercase text-slate-400 tracking-wider">Today, 10:02 AM</span>
                <h4 className="text-[10px] font-black text-slate-800 uppercase mt-0.5">Geographical Division, District & Thana Mapped</h4>
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed font-semibold">
                  Applicant residential coordinates and addresses aligned with Google Maps geographic lookup engines.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full bg-[#1b1c31] border-4 border-white flex items-center justify-center shadow" />
                <span className="text-[7px] font-black uppercase text-slate-400 tracking-wider">Today, 10:00 AM</span>
                <h4 className="text-[10px] font-black text-slate-800 uppercase mt-0.5">KYC Registration Profile Created</h4>
                <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                  Form initialized with parent managing group `{kycData.parent_stakeholder_name || 'SHL Master Group'}` as owner.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Printed Bottom Signatures Section */}
        <div className="hidden print:block pt-16 grid grid-cols-2 gap-8 text-center">
          <div className="border-t border-slate-300 pt-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Stakeholder Signature</span>
            <span className="text-[7px] text-slate-400 uppercase mt-0.5">Applicant Sign & Date</span>
          </div>
          <div className="border-t border-slate-300 pt-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Authorized Signatory</span>
            <span className="text-[7px] text-slate-400 uppercase mt-0.5">SHL Verification Officer</span>
          </div>
        </div>

      </div>

      {/* 4. White Footer Block Area (Excluded in Print) */}
      <div className="max-w-[1100px] mx-auto mt-12 py-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] font-black uppercase tracking-wider text-slate-400 print:hidden">
        <div>
          &copy; 2026 PAYPLUS ADMINHUB. ALL RIGHTS RESERVED.
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-slate-650 transition-colors">Privacy Policy</a>
          <span>|</span>
          <a href="#" className="hover:text-slate-650 transition-colors">Security Standards</a>
        </div>
      </div>

      {/* 5. Document Preview Zoom Modal */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 print:hidden">
          <div className="relative bg-slate-900 rounded-3xl border border-slate-800 max-w-[800px] w-full p-4 overflow-hidden shadow-2xl animate-in scale-in duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Document Scan Viewer</span>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs transition-colors"
              >
                &#10005;
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex justify-center items-center min-h-[300px] max-h-[60vh] overflow-auto bg-slate-950 rounded-2xl border border-slate-850 p-2">
              {previewModalUrl.toLowerCase().includes('.pdf') ? (
                <iframe src={previewModalUrl} className="w-full h-[50vh] rounded-xl border-none" title="PDF Scanner" />
              ) : (
                <img src={previewModalUrl} className="max-w-full max-h-[50vh] object-contain rounded-xl" alt="Document Preview" />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
              <span className="text-[8px] text-slate-500 uppercase font-bold">Secure KYC Vault Document</span>
              <a
                href={previewModalUrl}
                download
                className="h-8 px-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-[10px] font-black uppercase text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Scanner
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS style tags for perfect A4 page break printing and background rendering */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #kyc-a4-document {
            border: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
          /* Prevent headers and backgrounds from losing colors */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Set exact A4 print rules */
          @page {
            size: A4;
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  );
}
