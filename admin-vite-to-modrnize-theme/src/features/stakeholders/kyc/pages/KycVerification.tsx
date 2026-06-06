import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import {
  User,
  IdCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Shield,
  ShieldCheck,
  HeadphonesIcon,
  ChevronDown,
  Calendar,
  Globe,
  FileCheck,
  Plane,
  Building2,
  Cpu,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { deobfuscateId } from '@/lib/id-obfuscator';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ROUTES } from '@/constants/routes';
import BasicInfoForm from '../components/BasicInfoForm';

import IdentityForm from '../components/IdentityForm';
import DocumentUploadArea from '../components/DocumentUploadArea';
import BusinessDetailsForm from '../components/BusinessDetailsForm';
import AccountDetailsForm from '../components/AccountDetailsForm';
import ReviewSection from '../components/ReviewSection';
import { LocationPicker } from '../components/LocationPicker';
import { kycService } from '@/lib/auth/api/kyc.service';
import { geoService } from '@/lib/auth/api/geo.service';
import { userService } from '@/lib/auth/api/user.service';
import { AnalysisMetric, DocTableRow } from '../components/shared';
import { Store, Wallet } from 'lucide-react';
import { storageService } from '@/lib/auth/api/storage.service';
import DealerSelector from '../components/DealerSelector';
import { getUserDetails } from '@/lib/auth';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const ALL_STEPS = [
  { id: 0, title: 'Dealer', icon: Building2, sectionId: 'DealerSelection' },
  { id: 1, title: 'NID', icon: IdCard, sectionId: 'NID' },
  { id: 2, title: 'Basic Info', icon: User, sectionId: 'BasicInfo' },
  { id: 3, title: 'Documents', icon: Upload, sectionId: 'Documents' },
  { id: 4, title: 'Business', icon: Building2, sectionId: 'Business' },
  { id: 5, title: 'Accounts', icon: Wallet, sectionId: 'Accounts' },
  { id: 6, title: 'Review', icon: CheckCircle2, sectionId: 'Review' },
];

export default function KycVerification() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = (location.state as any)?.from || ROUTES.USERS;
  const { toast, ToastComponent } = useToast();

  const authUser = getUserDetails();
  const [currentStep, setCurrentStep] = useState<Step | 0>(0); // Will be adjusted in useEffect
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const nidInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (invalidFields.length > 0 && invalidFields[0] === 'nid_number' && nidInputRef.current) {
      nidInputRef.current.focus();
    }
  }, [invalidFields]);
  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState<number | null>(null);
  const [workflowConfig, setWorkflowConfig] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [ocrData, setOcrData] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<string>('trade');


  // Aggregated Form State
  const [kycData, setKycData] = useState({
    parent_stakeholder_id: '',
    parent_stakeholder_name: '',
    first_name: '',
    last_name: '',
    father_name: '',
    mother_name: '',
    email: '',
    phone: '',
    nid_number: '',
    present_address: {
      division_id: '',
      district_id: '',
      thana_id: '',
      address_detail: ''
    },
    permanent_address: {
      division_id: '',
      district_id: '',
      thana_id: '',
      address_detail: ''
    },
    documents: [
      { document_type: 'NID_FRONT', file_path: '', file_key: '', status: 'Pending' },
      { document_type: 'NID_BACK', file_path: '', file_key: '', status: 'Pending' }
    ],
    business: {
      info: {
        business_name: '',
        industry_type: '',
        bin_number: '',
        tin_number: ''
      },
      outlet: {
        outlet_name: '',
        street_address: '',
        division_id: '',
        district_id: '',
        thana_id: '',
        area_city: '',
        zip_code: '',
        contact_number: '',
        is_main_branch: true
      }
    },
    accounts: {
      bank_accounts: [],
      mfs_accounts: []
    }
  });

  useEffect(() => {
    const init = async () => {
      if (!id) return;

      try {
        setIsInitialLoading(true);

        // 1. Resolve username to userId first
        const userRes = await userService.getUserByUsername(id);
        if (!userRes || !userRes.data) {
          toast({ title: 'Error', description: 'User not found.', status: 'error' });
          navigate(returnPath);
          return;
        }

        const resolvedUserId = userRes.data.user_id || userRes.data.UserID || userRes.data.userId;
        setUserId(resolvedUserId);

        // 2. Fetch Existing KYC Data using original userId-based endpoint
        const kycRes = await kycService.getKyc(resolvedUserId);

        if (kycRes && kycRes.data) {
          const rawData = kycRes.data;
          
          // Normalize documents to handle PascalCase vs snake_case
          const normalizedDocs = (rawData.documents || rawData.Documents || []).map((d: any) => ({
            ...d,
            document_type: d.document_type || d.DocumentType || d.documentType,
            file_path: d.file_path || d.FilePath || d.filePath,
            file_key: d.file_key || d.FileKey || d.fileKey,
            status: d.status || d.Status,
            file_name: d.file_name || d.FileName || d.OriginalName || d.document_number || d.DocumentNumber
          }));

          const data = { ...rawData, documents: normalizedDocs };
          const fullName = `${data.first_name || data.FirstName || ''} ${data.last_name || data.LastName || ''}`.trim();
          setUserName(fullName || data.user_name || data.UserName || data.userName || id);
          
          setKycData(prev => ({
            ...prev,
            ...data,
            parent_stakeholder_id: data.parent_stakeholder_id || data.ParentStakeholderID || data.parentStakeholderID,
            parent_stakeholder_name: data.parent_stakeholder_name || data.ParentStakeholderName || data.parentStakeholderName,
            documents: normalizedDocs
          }));

          // Update scan previews if documents exist
          const frontNid = normalizedDocs.find((d: any) => d.document_type === 'NID_FRONT');
          const backNid = normalizedDocs.find((d: any) => d.document_type === 'NID_BACK');

          if (frontNid || backNid) {
            setScannedData(prev => ({
              ...prev,
              frontPreview: frontNid?.file_path ? (frontNid.file_path.startsWith('blob:') ? frontNid.file_path : storageService.getDownloadUrl(frontNid.file_path.split('/').pop()!)) : null,
              frontFileKey: frontNid?.file_key || null,
              frontScanned: !!frontNid,
              backPreview: backNid?.file_path ? (backNid.file_path.startsWith('blob:') ? backNid.file_path : storageService.getDownloadUrl(backNid.file_path.split('/').pop()!)) : null,
              backFileKey: backNid?.file_key || null,
              backScanned: !!backNid
            }));
          }

          // 2. Now we have the UserType, load the Workflow Config
          const type = data.user_type ?? data.UserType ?? data.userType;
          if (type) {
            const typeNum = Number(type);
            setUserType(typeNum);

            const configRes = await kycService.getWorkflowConfig(typeNum);
            if (configRes && configRes.data) {
              setWorkflowConfig(configRes.data);

              // Set initial step based on config
              const firstStep = ALL_STEPS.find(s => {
                if (s.sectionId === 'Review') return true;
                if (s.sectionId === 'DealerSelection') {
                  return configRes.data.requireDealerMapping && authUser?.user_type !== 8;
                }
                const config = configRes.data.sections.find((sec: any) => sec.id === s.sectionId);
                return config ? config.isVisible : true;
              });
              if (firstStep) setCurrentStep(firstStep.id as Step);
            }
          } else {
            console.warn('[KYC] No UserType found in KYC response');
          }
        } else {
          console.error('[KYC] Failed to load KYC data');
        }
      } catch (error) {
        console.error('[KYC] Initialization failed:', error);
        toast({ title: 'Error', description: 'Failed to initialize KYC workflow.', status: 'error' });
      } finally {
        setIsInitialLoading(false);
      }
    };

    init();
  }, [id, navigate]);

  useEffect(() => {
    // If the logged-in user is a Dealer (Type 8), auto-fill the dealer mapping
    if (authUser && authUser.user_type === 8 && !kycData.parent_stakeholder_id) {
      console.log('[KYC] Auto-populating Dealer Info from Session:', authUser.business_name);
      setKycData(prev => ({
        ...prev,
        parent_stakeholder_id: authUser.stakeholder_id,
        parent_stakeholder_name: authUser.business_name
      }));
    }
  }, [authUser, kycData.parent_stakeholder_id]);

  // State for tracking scan status and metadata
  const [scannedData, setScannedData] = useState({
    frontPreview: null as string | null,
    backPreview: null as string | null,
    frontFileKey: null as string | null,
    backFileKey: null as string | null,
    frontConfidence: null as number | null,
    backConfidence: null as number | null,
    frontScanned: false,
    backScanned: false
  });
  // Helper to map UI selected type to kycData document type
  const selectedTypeToDocType = (type: string) => {
    switch (type) {
      case 'passport': return 'PASSPORT';
      case 'trade': return 'TRADE_LICENSE';
      case 'license': return 'DRIVING_LICENSE';
      default: return 'OTHER_DOC';
    }
  };

  const updateDocField = (type: string, field: string, value: string) => {
    const docType = selectedTypeToDocType(type);
    setKycData(prev => {
      const existingDoc = prev.documents.find(d => d.document_type === docType);
      if (existingDoc) {
        return {
          ...prev,
          documents: prev.documents.map(d =>
            d.document_type === docType ? { ...d, [field]: value } : d
          )
        };
      } else {
        return {
          ...prev,
          documents: [...prev.documents, { document_type: docType, [field]: value, status: 'Pending' }]
        };
      }
    });
  };

  // nid_number is now handled directly in handleOcrComplete for better consistency

  const handleOcrComplete = (data: any, side: 'Front' | 'Back') => {
    console.log(`[KYC] OCR Complete for ${side}:`, data);
    setOcrData({ ...data, side });

    setScannedData(prev => ({
      ...prev,
      [`${side.toLowerCase()}Preview`]: data.FilePath || data.previewUrl,
      [`${side.toLowerCase()}FileKey`]: data.FileKey || null,
      [`${side.toLowerCase()}Confidence`]: data.confidence_score,
      [`${side.toLowerCase()}Scanned`]: true
    }));

    setKycData(prev => {
      const isBack = side === 'Back';
      const docType = isBack ? 'NID_BACK' : 'NID_FRONT';
      const existingDocs = prev.documents.filter(d => d.document_type !== docType);

      const updatedData = {
        ...prev,
        documents: [
          ...existingDocs,
          {
            document_type: docType,
            file_path: data.file_path || data.FilePath || data.filePath || data.previewUrl,
            file_key: data.file_key || data.FileKey || data.fileKey || '',
            status: 'Uploaded'
          }
        ]
      };

      // Merge OCR data selectively based on side
      if (!isBack) {
        // FRONT SIDE: Identity and Parents
        if (data.full_name && data.full_name.trim() !== "") {
          console.log("[KYC] Setting First Name from Front Scan:", data.full_name);
          updatedData.first_name = data.full_name;
          updatedData.last_name = "";
        }
        if (data.nid_number && data.nid_number.trim() !== "") {
          updatedData.nid_number = data.nid_number;
        }
        if (data.father_name && data.father_name.trim() !== "") {
          updatedData.father_name = data.father_name;
        }
        if (data.mother_name && data.mother_name.trim() !== "") {
          updatedData.mother_name = data.mother_name;
        }
      } else {
        // BACK SIDE: Address only
        if (data.address && data.address.trim() !== "") {
          console.log("[KYC] Setting Address from Back Scan:", data.address);
          updatedData.present_address = {
            ...prev.present_address,
            address_detail: data.address
          };
        }
      }

      return updatedData;
    });
  };

  // Initialization and loading handled in the consolidated useEffect at the top

  // Initialization and loading handled in the consolidated useEffect at the top

  const steps = workflowConfig
    ? ALL_STEPS.filter(s => {
      if (s.sectionId === 'Review') return true;
      if (s.sectionId === 'DealerSelection') {
        // Only show dealer selection if configured AND the logged-in user is NOT a dealer
        return workflowConfig.requireDealerMapping && authUser?.user_type !== 8;
      }
      const config = workflowConfig.sections.find((sec: any) => sec.id === s.sectionId);
      return config ? config.isVisible : true;
    })
    : ALL_STEPS;

  const handleRemoveScannedData = async (side: 'Front' | 'Back') => {
    const docType = side === 'Front' ? 'NID_FRONT' : 'NID_BACK';
    const oldFileKey = side === 'Front' ? scannedData.frontFileKey : scannedData.backFileKey;

    if (oldFileKey) {
      try {
        await storageService.deleteFile(oldFileKey);
      } catch (err) {
        console.error('[KYC] Failed to delete file from server:', err);
      }
    }

    setScannedData(prev => ({
      ...prev,
      [`${side.toLowerCase()}Preview`]: null,
      [`${side.toLowerCase()}FileKey`]: null,
      [`${side.toLowerCase()}Confidence`]: null,
      [`${side.toLowerCase()}Scanned`]: false
    }));

    setKycData(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.document_type !== docType)
    }));
  };

  const handleNext = async () => {
    setInvalidFields([]);
    const newInvalidFields: string[] = [];
    const currentIndex = steps.findIndex(s => s.id === currentStep);

    // 0. Dealer Mapping Validation
    if (currentStep === 0) {
      if (!kycData.parent_stakeholder_id) {
        newInvalidFields.push('parent_stakeholder_id');
      }
    }

    // 1. NID Section Validation
    if (currentStep === 1) {
      const nidSection = workflowConfig?.sections.find((s: any) => s.id === 'NID');
      if (nidSection) {
        nidSection.fields.forEach((f: any) => {
          if (f.isRequired) {
            if (f.id === 'front_image' && !scannedData.frontScanned) newInvalidFields.push('front_image');
            if (f.id === 'back_image' && !scannedData.backScanned) newInvalidFields.push('back_image');
            if (f.id === 'nid_number' && (!kycData.nid_number || kycData.nid_number.trim() === "")) newInvalidFields.push('nid_number');
          }
        });
      }
    }

    // 2. Basic Info Validation
    if (currentStep === 2) {
      const section = workflowConfig?.sections.find((s: any) => s.id === 'BasicInfo');
      if (section) {
        section.fields.forEach((f: any) => {
          if (f.isRequired) {
            if (['first_name', 'last_name', 'father_name', 'mother_name', 'email', 'phone'].includes(f.id)) {
              if (!kycData[f.id]) newInvalidFields.push(f.id);
            }
            if (f.id === 'present_address') {
              if (!kycData.present_address.division_id) newInvalidFields.push('present_address_division_id');
              if (!kycData.present_address.district_id) newInvalidFields.push('present_address_district_id');
              if (!kycData.present_address.thana_id) newInvalidFields.push('present_address_thana_id');
              if (!kycData.present_address.address_detail) newInvalidFields.push('present_address_detail');
            }
          }
        });
      }
    }

    // 3. Documents Validation
    if (currentStep === 3) {
      const section = workflowConfig?.sections.find((s: any) => s.id === 'Documents');
      if (section) {
        section.fields.forEach((f: any) => {
          if (f.isRequired) {
            const mappedType = selectedTypeToDocType(f.id);
            const doc = kycData.documents.find(d => d.document_type === mappedType);
            
            // Validate File Upload
            if (!doc || !doc.file_path) {
              newInvalidFields.push(f.id);
            }
            
            // Validate Meta-data (Number, Dates)
            if (!doc?.document_number || doc.document_number.trim() === "") {
              newInvalidFields.push(`${f.id}_number`);
            }
            if (!doc?.issue_date) {
              newInvalidFields.push(`${f.id}_issue_date`);
            }
            if (!doc?.expiry_date) {
              newInvalidFields.push(`${f.id}_expiry_date`);
            }
          }
        });
      }
    }

    if (newInvalidFields.length > 0) {
      setInvalidFields(newInvalidFields);
      
      // Map field IDs to human-readable labels
      const fieldLabels: Record<string, string> = {
        'parent_stakeholder_id': 'Dealer Mapping',
        'front_image': 'NID Front',
        'back_image': 'NID Back',
        'nid_number': 'NID Number',
        'first_name': 'First Name',
        'last_name': 'Last Name',
        'father_name': 'Father Name',
        'mother_name': 'Mother Name',
        'email': 'Email Address',
        'phone': 'Mobile Number',
        'present_address_division_id': 'Present Address Division',
        'present_address_district_id': 'Present Address District',
        'present_address_thana_id': 'Present Address Thana',
        'present_address_detail': 'Present Address Detail',
        'passport': 'Passport Document',
        'passport_number': 'Passport Number',
        'passport_issue_date': 'Passport Issue Date',
        'passport_expiry_date': 'Passport Expiry Date',
        'trade': 'Trade License',
        'trade_number': 'Trade License Number',
        'trade_issue_date': 'Trade License Issue Date',
        'trade_expiry_date': 'Trade License Expiry Date',
        'license': "Driver's License",
        'license_number': 'License Number',
        'license_issue_date': 'License Issue Date',
        'license_expiry_date': 'License Expiry Date',
        'other': 'Supporting Document',
        'other_number': 'Document Number',
        'other_issue_date': 'Document Issue Date',
        'other_expiry_date': 'Document Expiry Date'
      };

      const missing = newInvalidFields.map(id => fieldLabels[id] || id).slice(0, 3);
      const suffix = newInvalidFields.length > 3 ? ` and ${newInvalidFields.length - 3} more` : '';

      toast({
        title: 'Missing Required Info',
        description: `Please provide: ${missing.join(', ')}${suffix}.`,
        status: 'warning'
      });
      return;
    }

    if (currentIndex === steps.length - 1) {
      handleSubmit();
    } else {
      // Auto-save draft when moving between steps
      await handleDraft();
      const nextStep = steps[currentIndex + 1];
      setCurrentStep(nextStep.id as Step);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex === 0) {
      setShowExitConfirm(true);
    } else {
      const prevStep = steps[currentIndex - 1];
      setCurrentStep(prevStep.id as Step);
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;

    try {
      setIsSubmitting(true);
      const payload = {
        ...kycData,
        user_id: userId,
        parent_stakeholder_id: kycData.parent_stakeholder_id,
        is_draft: false
      };

      const response = await kycService.submitKyc(payload);
      if (response.data) {
        toast({
          title: 'Success',
          description: 'KYC application submitted successfully.',
          status: 'success'
        });
        navigate(returnPath);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit KYC application.',
        status: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraft = async () => {
    if (!userId) return;

    try {
      setIsSubmitting(true);
      const payload = {
        ...kycData,
        user_id: userId,
        parent_stakeholder_id: kycData.parent_stakeholder_id,
        is_draft: true
      };

      const response = await kycService.submitKyc(payload);
      if (response.data) {
        toast({
          title: 'Draft Saved',
          description: 'Your progress has been saved as a draft.',
          status: 'success'
        });
      }
    } catch (error) {
      console.error('Draft save failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft.',
        status: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = async (loc: any) => {
    console.log('[KYC] Location Selected from Map:', loc);

    // 1. Set raw address detail
    setKycData(prev => ({
      ...prev,
      present_address: {
        ...prev.present_address,
        address_detail: loc.address
      }
    }));

    try {
      // 2. Fetch all divisions to match
      const divisions = await geoService.getDivisionCombo();
      const cleanName = (name: string) => name.toLowerCase().replace('division', '').replace('district', '').trim();

      const matchedDivision = divisions.find((d: any) => cleanName(d.label).includes(cleanName(loc.division)) || cleanName(loc.division).includes(cleanName(d.label)));

      if (matchedDivision) {
        const divisionId = matchedDivision.value;
        console.log('[KYC] Matched Division:', matchedDivision.label, divisionId);

        // 3. Fetch districts for this division
        const districts = await geoService.getDistrictByDivision(divisionId);
        const matchedDistrict = districts.find((d: any) => cleanName(d.label).includes(cleanName(loc.district)) || cleanName(loc.district).includes(cleanName(d.label)));

        if (matchedDistrict) {
          const districtId = matchedDistrict.value;
          console.log('[KYC] Matched District:', matchedDistrict.label, districtId);

          // 4. Fetch thanas for this district
          const thanas = await geoService.getThanaByDistrict(districtId);
          const matchedThana = thanas.find((t: any) => cleanName(t.label).includes(cleanName(loc.thana)) || cleanName(loc.thana).includes(cleanName(t.label)));

          setKycData(prev => ({
            ...prev,
            present_address: {
              ...prev.present_address,
              division_id: divisionId,
              district_id: districtId,
              thana_id: matchedThana ? matchedThana.value : prev.present_address.thana_id,
              address_detail: loc.address
            }
          }));

          if (matchedThana) console.log('[KYC] Matched Thana:', matchedThana.label, matchedThana.value);
        } else {
          setKycData(prev => ({
            ...prev,
            present_address: { ...prev.present_address, division_id: divisionId, address_detail: loc.address }
          }));
        }
      }
    } catch (err) {
      console.error('[KYC] Failed to match map location to geo data:', err);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
            <Cpu className="absolute inset-0 m-auto w-6 h-6 text-primary-600 animate-pulse" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse">Initializing Secure Portal</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Syncing workflow configurations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans scrollbar-premium">
      {/* Premium Fixed Header - Smart Responsive */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-b border-slate-200/60 z-[100] px-4 md:px-8 py-2.5 md:py-4 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2 md:gap-8">
          {/* Left: Brand & Exit */}
          <div className="flex items-center gap-2 md:gap-6 shrink-0">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-900 font-black uppercase text-[9px] tracking-widest px-0 h-8 transition-all group min-w-[32px]"
            >
              <ArrowLeft className="w-4 h-4 md:mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden lg:inline">{steps.findIndex(s => s.id === currentStep) === 0 ? 'Exit to List' : 'Back'}</span>
            </Button>
            <div className="hidden sm:block h-6 md:h-8 w-[1px] bg-slate-200" />
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm md:text-lg font-black text-slate-900 tracking-tight leading-none uppercase truncate">{userName}</h1>
              {kycData.parent_stakeholder_name && (
                <p className="text-amber-600 text-[9px] md:text-[10px] font-black mt-1 uppercase tracking-widest flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Managed by: {kycData.parent_stakeholder_name}
                </p>
              )}
              <p className="text-slate-500 text-[9px] md:text-[11px] font-bold mt-1 uppercase tracking-tight">
                Step {steps.findIndex(s => s.id === currentStep) + 1}/{steps.length}
              </p>
            </div>
          </div>

          {/* Center: Stepper (Responsive Adaptive) */}
          <div className="flex-1 max-w-[600px] min-w-0 px-2 md:px-0">
            <div className="relative">
              <div className="absolute top-[14px] left-0 w-full h-[1px] bg-slate-100 z-0" />
              <div className="relative z-10 flex justify-between items-center">
                {steps.map((step, index) => {
                  const currentIndex = steps.findIndex(s => s.id === currentStep);
                  const isActive = currentStep === step.id;
                  const isCompleted = currentIndex > index;

                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center gap-1 group cursor-pointer outline-none"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          (isCompleted || isActive) && setCurrentStep(step.id as Step);
                        }
                      }}
                      onClick={() => (isCompleted || isActive) && setCurrentStep(step.id as Step)}
                    >
                      <div className={cn(
                        "w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center transition-all duration-500 border relative",
                        isActive ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/20" :
                          isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                            "bg-white border-slate-200 text-slate-300 group-hover:border-slate-300"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5" /> : <step.icon className="w-2.5 md:w-3 h-2.5 md:h-3" />}
                        {isActive && <div className="absolute -inset-1 rounded-full border-2 border-primary-600/40 animate-ping" />}
                      </div>
                      <span className={cn(
                        "hidden lg:block text-[9px] font-black uppercase tracking-widest transition-all",
                        isActive ? "text-primary-600" : isCompleted ? "text-slate-500" : "text-slate-300"
                      )}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-3 justify-end shrink-0">
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 text-white font-black uppercase text-[10px] md:text-[12px] tracking-widest px-3 md:px-6 rounded-xl h-8 md:h-10 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : steps.findIndex(s => s.id === currentStep) === steps.length - 1 ? (
                'Final'
              ) : (
                <>
                  <span className="hidden sm:inline">Next</span>
                  <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Responsive Spacing */}
      <div className="pb-12">
        <div className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white border border-slate-200/60 rounded-3xl p-10 shadow-sm shadow-slate-200/50 min-h-[400px]">
                {currentStep === 0 && (
                  <DealerSelector
                    selectedId={kycData.parent_stakeholder_id}
                    onSelect={(id, name) => setKycData(prev => ({ ...prev, parent_stakeholder_id: id, parent_stakeholder_name: name }))}
                    viewMode="dropdown"
                  />
                )}
                {currentStep === 1 && (
                  <IdentityForm
                    onOcrComplete={handleOcrComplete}
                    onRemove={handleRemoveScannedData}
                    scannedData={scannedData}
                    config={workflowConfig?.sections.find((s: any) => s.id === 'NID')}
                    errors={invalidFields}
                  />
                )}
                {currentStep === 2 && (
                  <BasicInfoForm
                    data={kycData}
                    ocrData={ocrData}
                    onChange={(data: any) => setKycData(prev => ({ ...prev, ...data }))}
                    config={workflowConfig?.sections.find((s: any) => s.id === 'BasicInfo')}
                    errors={invalidFields}
                  />
                )}
                {currentStep === 3 && (
                  <DocumentUploadArea
                    onTypeChange={setSelectedDocType}
                    onUpload={(doc) => setKycData(prev => ({
                      ...prev,
                      documents: [
                        ...prev.documents.filter(d => d.document_type !== doc.document_type),
                        { ...doc, file_key: doc.file_key || '' }
                      ]
                    }))}
                    onRemove={async (type) => {
                      const doc = kycData.documents.find(d => d.document_type === type);
                      if (doc?.file_key) {
                        try {
                          await storageService.deleteFile(doc.file_key);
                        } catch (err) {
                          console.error('[KYC] Failed to delete file:', err);
                        }
                      }
                      setKycData(prev => ({
                        ...prev,
                        documents: prev.documents.filter(d => d.document_type !== type)
                      }));
                    }}
                    uploadedDocs={kycData.documents}
                    config={workflowConfig?.sections.find((s: any) => s.id === 'Documents')}
                  />
                )}
                {currentStep === 4 && (
                  <BusinessDetailsForm
                    data={kycData.business}
                    ownerData={{
                      first_name: kycData.first_name,
                      last_name: kycData.last_name,
                      email: kycData.email,
                      phone: kycData.phone
                    }}
                    onChange={(data: any) => setKycData(prev => ({ ...prev, business: data }))}
                    config={workflowConfig?.sections.find((s: any) => s.id === 'Business')}
                  />
                )}
                {currentStep === 5 && (
                  <AccountDetailsForm
                    data={kycData.accounts}
                    onChange={(data) => setKycData(prev => ({ ...prev, accounts: data }))}
                    config={workflowConfig?.sections.find((s: any) => s.id === 'Accounts')}
                  />
                )}
                {currentStep === 6 && <ReviewSection data={kycData} config={workflowConfig} />}
              </div>
            </div>

            {/* Right Sidebar Column */}
            <div className="lg:col-span-4 space-y-6">
              {/* Dynamic Identity Details Card */}
              {(currentStep === 1 || currentStep === 3) && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm shadow-slate-200/50 space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                      {currentStep <= 2 ? 'Identity Details' :
                        selectedDocType === 'passport' ? 'Passport Data' :
                          selectedDocType === 'trade' ? 'Legal License' :
                            selectedDocType === 'license' ? "Driver's Permit" : 'Validation Data'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Identity Record</p>
                  </div>

                  {(() => {
                    const nidConfig = workflowConfig?.sections.find((s: any) => s.id === 'NID');
                    const isNidVisible = !nidConfig || nidConfig.fields.find((f: any) => f.id === 'nid_number')?.isVisible !== false;
                    const isNidRequired = !nidConfig || nidConfig.fields.find((f: any) => f.id === 'nid_number')?.isRequired !== false;

                    const docSection = workflowConfig?.sections.find((s: any) => s.id === 'Documents');
                    const currentDocConfig = docSection?.fields.find((f: any) => f.id === selectedDocType);
                    const isDocRequired = currentDocConfig?.isRequired;

                    if (!isNidVisible && currentStep <= 2) return null;

                    const docData = kycData.documents.find(d => d.document_type === selectedTypeToDocType(selectedDocType));

                    return (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            {currentStep <= 2 ? 'National ID' :
                              selectedDocType === 'passport' ? 'Passport No' :
                                selectedDocType === 'trade' ? 'License No' :
                                  selectedDocType === 'license' ? 'License Number' : 'Document No'}
                            {((currentStep <= 2 && isNidRequired) || (currentStep === 3 && isDocRequired)) && <span className="text-red-500 ml-0.5">*</span>}
                          </label>
                          <div className="relative group">
                            <IdCard className={cn(
                              "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                              (invalidFields.includes('nid_number') || (currentStep === 3 && invalidFields.includes(`${selectedDocType}_number`))) ? "text-red-500" : "text-slate-400 group-focus-within:text-primary-600"
                            )} />
                            <input
                              ref={invalidFields[0] === 'nid_number' || invalidFields[0] === `${selectedDocType}_number` ? nidInputRef : null}
                              value={currentStep <= 2 ? kycData.nid_number : (docData?.document_number || '')}
                              onChange={(e) => {
                                if (currentStep === 3) {
                                  updateDocField(selectedDocType, 'document_number', e.target.value);
                                } else if (currentStep <= 2) {
                                  setKycData(prev => ({ ...prev, nid_number: e.target.value }));
                                }
                              }}
                              className={cn(
                                "w-full bg-slate-50 border rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold text-slate-900 focus:outline-none transition-all",
                                (invalidFields.includes('nid_number') || (currentStep === 3 && invalidFields.includes(`${selectedDocType}_number`))) 
                                  ? "border-red-500 focus:ring-red-500/5 shadow-red-500/5" 
                                  : "border-slate-200 focus:ring-primary-600/5 focus:border-primary-600"
                              )}
                              placeholder={currentStep <= 2 ? "NID Number" : "Enter document number"}
                            />
                          </div>
                        </div>

                        {/* Issue & Expiry Dates for Documents Section only */}
                        {currentStep === 3 && (
                          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Issue Date
                                {isDocRequired && <span className="text-red-500 ml-0.5">*</span>}
                              </label>
                              <div className="relative group">
                                <Calendar className={cn(
                                  "absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors pointer-events-none",
                                  invalidFields.includes(`${selectedDocType}_issue_date`) ? "text-red-500" : "text-slate-400 group-focus-within:text-primary-600"
                                )} />
                                <input
                                  type="date"
                                  value={docData?.issue_date || ''}
                                  onChange={(e) => updateDocField(selectedDocType, 'issue_date', e.target.value)}
                                  className={cn(
                                    "w-full bg-slate-50 border rounded-2xl pl-11 pr-3 py-3 text-[11px] font-bold text-slate-900 focus:outline-none transition-all appearance-none cursor-pointer",
                                    invalidFields.includes(`${selectedDocType}_issue_date`) 
                                      ? "border-red-500 focus:ring-red-500/5" 
                                      : "border-slate-200 focus:border-primary-600"
                                  )}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Expiry Date
                                {isDocRequired && <span className="text-red-500 ml-0.5">*</span>}
                              </label>
                              <div className="relative group">
                                <Calendar className={cn(
                                  "absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors pointer-events-none",
                                  invalidFields.includes(`${selectedDocType}_expiry_date`) ? "text-red-500" : "text-slate-400 group-focus-within:text-primary-600"
                                )} />
                                <input
                                  type="date"
                                  value={docData?.expiry_date || ''}
                                  onChange={(e) => updateDocField(selectedDocType, 'expiry_date', e.target.value)}
                                  className={cn(
                                    "w-full bg-slate-50 border rounded-2xl pl-11 pr-3 py-3 text-[11px] font-bold text-slate-900 focus:outline-none transition-all appearance-none cursor-pointer",
                                    invalidFields.includes(`${selectedDocType}_expiry_date`) 
                                      ? "border-red-500 focus:ring-red-500/5" 
                                      : "border-slate-200 focus:border-primary-600"
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Region</label>
                          <div className="relative group">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-10 py-3.5 flex items-center justify-between text-xs font-bold text-slate-900 cursor-default">
                              <span>Bangladesh (Primary)</span>
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Google Maps Location Picker (Step 2 Only) */}
              {currentStep === 2 && (
                <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm shadow-slate-200/50 animate-in slide-in-from-right-4 duration-500">
                  <div className="p-6 pb-4 flex flex-col gap-1 border-b border-slate-50">
                    <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-900">Geo Location</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Pin your present address</p>
                  </div>
                  <LocationPicker className="border-none shadow-none rounded-none" onLocationSelect={handleLocationSelect} />
                </div>
              )}

              {/* Secure Storage Card */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield className="w-16 h-16 rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                    <Shield className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-2">Vault Protection</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">All data is encrypted via <span className="text-white">AES-256</span> and stored in an isolated environment.</p>
                  </div>
                </div>
              </div>

              {/* Live Support Widget */}
              <div
                className="bg-white border border-slate-200/60 rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:border-primary-600/30 transition-all shadow-sm shadow-slate-200/50 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/5"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Help widget logic here
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:scale-105 transition-transform">
                    <HeadphonesIcon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Verification Help</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">Active Now</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>

        </div>
      </div>

      <ConfirmDialog
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={() => navigate(returnPath)}
        title="Exit KYC Workflow?"
        description="Are you sure you want to exit to the list?"
        infoMessage="If you don't save or submit, this user might not be activated and your progress for this step will be lost."
        infoType="warning"
        confirmLabel="Exit to List"
        confirmVariant="danger"
        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
      />

      <ToastComponent />

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-70px); }
          50% { transform: translateY(70px); }
        }
        .scrollbar-premium::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-premium::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-premium::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .scrollbar-premium::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .scrollbar-premium {
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
          scrollbar-gutter: stable;
        }
      `}</style>
    </div>
  );
}
