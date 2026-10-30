import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, MessageCircle, MapPin, Clock, CheckCircle2, Send, Phone, ArrowRight } from 'lucide-react';
import { api, apiMessage, apiDetails } from '../../lib/api';
import { PageHero } from '../../components/layout/PageHero';
import { Reveal } from '../../components/animations/Reveal';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select, Textarea, Checkbox } from '../../components/ui/Field';
import { FileDropzone } from '../../components/forms/FileDropzone';
import { useSettings } from '../../hooks/useSettings';
import { ContactPrintingInfo } from '../../components/marketing/ContactPrintingInfo';
import { SUPPORT_PHONE, CONTACT_LINKS } from '../../lib/contact';
import { useI18n } from '../../i18n/I18nContext';
import { money } from '../../lib/utils';

const phoneRegex = /^(\+?\d{1,3}[\s-]?)?\d{10}$/;

const schema = z.object({
  name: z.string().min(2, 'validation.nameShort'),
  email: z.string().email('validation.email'),
  phone: z.string().min(10, 'contactForm.phoneInvalid').regex(phoneRegex, 'contactForm.phoneInvalid'),
  category: z.string().min(2, 'validation.categoryRequired'),
  deadline: z.string().min(1, 'contactForm.deadlineRequired'),
  message: z.string().min(20, 'validation.messageShort'),
  consent: z.literal(true, {
    message: 'validation.consentRequired',
  }),
});

const ZOD_TO_I18N = {
  nameShort: 'validation.nameShort',
  email: 'validation.email',
  phoneInvalid: 'contactForm.phoneInvalid',
  categoryRequired: 'validation.categoryRequired',
  deadlineRequired: 'contactForm.deadlineRequired',
  messageShort: 'validation.messageShort',
  consentRequired: 'validation.consentRequired',
};

export default function Contact() {
  const { t, lang } = useI18n();
  const [params] = useSearchParams();
  const intent = params.get('intent');
  const navigate = useNavigate();
  const { settings } = useSettings();
  const business = settings?.business || {};
  const [reference, setReference] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateGuard, setDuplicateGuard] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const catList = t('contactPage.categories');

  // Fetch active services for category dropdown
  useEffect(() => {
    let mounted = true;
    const fetchServices = async () => {
      try {
        const { data } = await api.get('/services');
        const cats = [...new Set((data.services || []).map((s) => s.category).filter(Boolean))];
        setCategories(cats.length > 0 ? cats : catList);
      } catch {
        setCategories(catList);
      } finally {
        if (mounted) setServicesLoading(false);
      }
    };
    fetchServices();
    return () => { mounted = false; };
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      category: intent === 'quote' && catList.length > 1 ? catList[1] : catList[0] || '',
      deadline: '',
    },
  });

  const err = (field) => {
    const raw = errors[field]?.message;
    const key = ZOD_TO_I18N[raw];
    return key ? t(key) : raw;
  };

  const onSubmit = async (values) => {
    if (duplicateGuard) return;
    setSubmitting(true);
    setDuplicateGuard(true);

    try {
      // Upload files first if any
      let fileIds = [];
      if (uploadedFiles.length > 0) {
        const data = new FormData();
        uploadedFiles.forEach((f) => data.append('files', f));
        data.append('purpose', 'reference');
        const { data: res } = await api.post('/files/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileIds = (res.files || []).map((f) => f._id);
      }

      const { data: res } = await api.post('/support/enquiry', {
        name: values.name,
        email: values.email,
        phone: values.phone,
        category: values.category,
        deadline: values.deadline || null,
        message: values.message,
        fileIds,
      });

      const enquiryRef = res.enquiry?.reference || res.reference;
      setReference(enquiryRef);

      // Navigate to confirmation page with enquiry data in state
      navigate(`/enquiry-confirmation/${enquiryRef}`, {
        state: {
          type: 'enquiry',
          data: {
            reference: enquiryRef,
            name: values.name,
            email: values.email,
            phone: values.phone,
            category: values.category,
            deadline: values.deadline,
            message: values.message,
            fileIds,
          },
        },
      });

      reset({ category: intent === 'quote' && catList.length > 1 ? catList[1] : catList[0] || '', deadline: '', consent: false });
      setUploadedFiles([]);
    } catch (err) {
      setSubmitting(false);
      setDuplicateGuard(false);
      toast.error(apiMessage(err, t('common.somethingWentWrong')));
    }
  };

  const handleFilesChange = (files) => {
    setUploadedFiles(files);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <PageHero
        eyebrow={t('contactPage.eyebrow')}
        title={t('contactPage.title')}
        description={t('contactPage.description')}
      />

      <section className="py-14">
        <div className="container-page">
          <ContactPrintingInfo className="mb-8" headingLevel="h2" />

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal className="rounded-2xl border border-line bg-white p-6 shadow-[0_20px_50px_-34px_rgba(20,83,45,0.4)]">
              {reference ? (
                <div className="py-8 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-mint text-forest">
                    <CheckCircle2 className="size-7" aria-hidden />
                  </span>
                  <h2 className="mt-4 text-lg font-bold">{t('confirmation.enquiryReceived')}</h2>
                  <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
                    {t('confirmation.keepReference')}
                  </p>
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <span className="text-[12px] font-semibold text-ink break-all">{reference}</span>
                    <Button size="icon" variant="outline" onClick={() => {
                      navigator.clipboard.writeText(reference);
                    }} aria-label="Copy reference number">
                      <ArrowRight className="size-4" aria-hidden />
                    </Button>
                  </div>
                  <Button className="mt-5" variant="secondary" onClick={() => setReference(null)}>
                    {t('contactPage.successAgain')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold">{t('contactPage.formHeading')}</h2>
                    <p className="mt-1 text-[13px] text-muted">{t('contactPage.formSub')}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label={t('contactPage.name')} htmlFor="name" required error={err('name')}>
                      <Input id="name" placeholder="Aarav Patel" {...register('name')} />
                    </FormField>
                    <FormField label={t('contactPage.email')} htmlFor="email" required error={err('email')}>
                      <Input id="email" type="email" placeholder="you@college.edu" {...register('email')} />
                    </FormField>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label={t('contactForm.phone')} htmlFor="phone" required error={err('phone')} hint={t('contactForm.phoneHint')}>
                      <Input id="phone" type="tel" placeholder={t('contactForm.phonePlaceholder')} {...register('phone')} />
                    </FormField>
                    <FormField label={t('contactPage.category')} htmlFor="category" required error={err('category')}>
                      <Select id="category" {...register('category')} disabled={servicesLoading}>
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </Select>
                    </FormField>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label={t('contactForm.deadlineLabel')} htmlFor="deadline" required error={err('deadline')}>
                      <Input id="deadline" type="date" min={today} {...register('deadline')} />
                    </FormField>
                    <div className="flex items-end">
                      <FormField label={t('contactForm.fileUpload')} htmlFor="file-upload" hint={t('contactForm.fileUploadHint')}>
                        <FileDropzone
                          files={uploadedFiles}
                          onChange={handleFilesChange}
                          purpose="reference"
                          maxFiles={5}
                          maxMb={10}
                          label={t('contactForm.fileUpload')}
                        />
                      </FormField>
                    </div>
                  </div>

                  <FormField label={t('contactPage.message')} htmlFor="message" required error={err('message')} hint={t('contactPage.messageHint')}>
                    <Textarea id="message" rows={6} placeholder="Tell us about your requirement, deadline and any relevant details…" {...register('message')} />
                  </FormField>

                  <Checkbox label={t('contactPage.consent')} {...register('consent')} />
                  {err('consent') && <p className="text-[12px] font-medium text-danger">{err('consent')}</p>}

                  <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                    <Button type="submit" loading={isSubmitting || submitting} disabled={duplicateGuard} icon={Send}>
                      {duplicateGuard ? t('contactForm.duplicateSubmission') : t('contactForm.submitting')}
                    </Button>
                    <p className="text-[11.5px] text-muted">{t('contactPage.privacyNote')}</p>
                  </div>
                </form>
              )}
            </Reveal>

            <div className="space-y-4">
              <Reveal delay={0.05} className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-[14px] font-semibold">{t('contactPage.direct')}</h2>
                <ul className="mt-3 space-y-3 text-[13px] text-muted">
                  <li className="flex items-start gap-2.5">
                    <Mail className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
                    <a href={`mailto:${business.email || 'hello@acadexa.example'}`} className="hover:text-forest">
                      {business.email || 'hello@acadexa.example'}
                    </a>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
                    <a href={SUPPORT_PHONE.tel} className="hover:text-forest" aria-label={t('contactBlock.callAria', { phone: SUPPORT_PHONE.display })}>
                      {business.phone || SUPPORT_PHONE.display}
                    </a>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <MessageCircle className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
                    <span>
                      <a href={CONTACT_LINKS.general} target="_blank" rel="noopener noreferrer" className="hover:text-forest">
                        {t('contactPage.whatsappLabel', { phone: SUPPORT_PHONE.display })}
                      </a>{' '}
                      <span className="block text-[11.5px] text-slate-400">{t('contactPage.whatsappNote')}</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
                    {business.address || 'Ahmedabad, Gujarat, India'}
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
                    {t('contactPage.hours')}
                  </li>
                </ul>
              </Reveal>

              <Reveal delay={0.1} className="rounded-2xl border border-emerald/25 bg-mint p-5">
                <h2 className="text-[14px] font-semibold text-forest">{t('contactPage.existing')}</h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-forest/80">
                  {t('contactPage.existingBody')}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button to="/login" size="sm" variant="primary">
                    {t('auth.signIn')}
                  </Button>
                  <Button to="/register" size="sm" variant="secondary">
                    {t('auth.createAccount')}
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={0.15} className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-[14px] font-semibold">{t('contactPage.response')}</h2>
                <ul className="mt-2.5 space-y-2 text-[12.5px] leading-relaxed text-muted">
                  <li>• {t('contactPage.expectation.enquiries')}</li>
                  <li>• {t('contactPage.expectation.quotation')}</li>
                  <li>• {t('contactPage.expectation.tickets')}</li>
                  <li>• {t('contactPage.expectation.privacy')}</li>
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
