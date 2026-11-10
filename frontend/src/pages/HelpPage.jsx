import React, { useState } from 'react';
import {
  Box, Container, Typography, Button, Grid, Stack,
  Accordion, AccordionSummary, AccordionDetails, Chip,
  List, ListItemButton, ListItemIcon, ListItemText,
  TextField, Avatar, Alert, InputAdornment
} from '@mui/material';
import {
  ArrowBack, ExpandMore, QuestionAnswer, Book, ContactSupport,
  Email, LocationOn, WhatsApp, Search, School, Assignment,
  AccountCircle, Notifications, Send, MenuBook, PrivacyTip,
  OpenInNew, VerifiedUser, Forum, TaskAlt, FactCheck
} from '@mui/icons-material';
import { alpha, useTheme, styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import GlassCard from '../components/ui/GlassCard';
import { getHelpContent, getResourceLinks } from './help/helpContent';

// Styled Components
const StyledAccordion = styled(Accordion)(({ theme }) => ({
  background: 'transparent',
  boxShadow: 'none',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: `${theme.spacing(2)} !important`,
  marginBottom: theme.spacing(1.5),
  '&:before': { display: 'none' },
  '&.Mui-expanded': {
    margin: `0 0 ${theme.spacing(1.5)} 0`,
    background: theme.palette.background.paper,
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
  }
}));

// Kontak di bawah masih perlu dikonfirmasi pihak kampus (lihat docs/SerahTerima.md bagian 10).
const SUPPORT_EMAIL = 'pengaduan@bunghatta.ac.id';

const QUICK_GUIDE = {
  mahasiswa: [
    { step: 1, title: 'Daftar', description: 'Isi data & unggah KTM', icon: <AccountCircle /> },
    { step: 2, title: 'Diverifikasi', description: 'Admin mencocokkan KTM', icon: <School /> },
    { step: 3, title: 'Lapor', description: 'Isi laporan & lampiran', icon: <Assignment /> },
    { step: 4, title: 'Pantau', description: 'Cek status & percakapan', icon: <Notifications /> }
  ],
  admin: [
    { step: 1, title: 'Verifikasi', description: 'Cocokkan KTM pendaftar', icon: <VerifiedUser /> },
    { step: 2, title: 'Tinjau', description: 'Baca laporan di kategori Anda', icon: <FactCheck /> },
    { step: 3, title: 'Tindak lanjuti', description: 'Ubah status & balas chat', icon: <Forum /> },
    { step: 4, title: 'Selesaikan', description: 'Tutup dengan alasan jelas', icon: <TaskAlt /> }
  ]
};

const LINK_ICONS = { manual: <MenuBook />, privacy: <PrivacyTip /> };

const HelpPage = ({ isEmbedded = false, audience = 'mahasiswa' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { faqs: faqData, categoryLabels } = getHelpContent(audience);
  const quickGuide = QUICK_GUIDE[audience] ?? QUICK_GUIDE.mahasiswa;
  const resourceLinks = getResourceLinks();
  const showContact = audience === 'mahasiswa';

  // Contact Methods
  const contactMethods = [
    {
      type: 'whatsapp', title: 'WhatsApp', value: '+62 751 461208',
      description: 'Chat langsung dengan admin', icon: <WhatsApp />,
      action: () => window.open('https://wa.me/62751461208')
    },
    {
      type: 'email', title: 'Email', value: SUPPORT_EMAIL,
      description: 'Pertanyaan seputar laporan dan akun', icon: <Email />,
      action: () => window.open(`mailto:${SUPPORT_EMAIL}`)
    },
    {
      type: 'location', title: 'Lokasi', value: 'Gedung Rektorat Lt. 2',
      description: 'Jl. Bagindo Aziz Chan No. 8, Padang', icon: <LocationOn />,
      action: () => window.open('https://maps.google.com/?q=Universitas+Bung+Hatta+Padang')
    }
  ];

  const faqCategoryIds = [...new Set(faqData.map((item) => item.category))];
  const categories = [
    { id: 'all', label: 'Semua', count: faqData.length },
    ...faqCategoryIds.map((id) => ({
      id,
      label: categoryLabels[id] ?? id,
      count: faqData.filter((item) => item.category === id).length
    }))
  ];

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEmailSupport = () => {
    const subject = encodeURIComponent('Bantuan Sistem Pengaduan Kemahasiswaan');
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
  };

  return (
    <Box sx={{
      minHeight: isEmbedded ? 'auto' : '100vh',
      bgcolor: isEmbedded ? 'transparent' : 'background.default',
      py: isEmbedded ? 0 : 4
    }}>
      {!isEmbedded && (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3, px: 10 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
            sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
          >
            Kembali
          </Button>
        </Stack>
      )}

      <Container maxWidth="lg" disableGutters={isEmbedded}>
        {/* Modern Search Header */}
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          {!isEmbedded && (
            <>
              <Typography variant="h3" fontWeight={800} gutterBottom sx={{
                color: theme.palette.primary.main
              }}>
                Pusat Bantuan
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 400 }}>
                Temukan jawaban untuk pertanyaan Anda dengan cepat
              </Typography>
            </>
          )}

          <TextField
            fullWidth
            placeholder="Cari solusi atau kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search color="primary" /></InputAdornment>,
              sx: {
                bgcolor: 'background.paper',
                borderRadius: 4,
                fontSize: '1.1rem',
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                '& fieldset': { border: 'none' },
                maxWidth: 600,
                mx: 'auto'
              }
            }}
          />
        </Box>

        <Stack spacing={4}>
          {/* Quick Guide */}
              <GlassCard variant="glass" sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Book color="primary" sx={{ mr: 1.5 }} /> Panduan Cepat
                </Typography>
                <Grid container spacing={2}>
                  {quickGuide.map((guide) => (
                    <Grid size={{ xs: 6, sm: 3 }} key={guide.step}>
                      <Box sx={{
                        textAlign: 'center', p: 2, borderRadius: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        height: '100%', transition: 'all 0.2s',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08), transform: 'translateY(-2px)' }
                      }}>
                        <Avatar sx={{ mx: 'auto', mb: 1.5, bgcolor: 'background.paper', color: 'primary.main', boxShadow: theme.shadows[2] }}>
                          {guide.icon}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={700}>{guide.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.2 }}>
                          {guide.description}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </GlassCard>

              {/* FAQ Section */}
              <GlassCard variant="glass" sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <QuestionAnswer color="primary" sx={{ mr: 1.5 }} /> Pertanyaan Umum (FAQ)
                </Typography>

                <Box sx={{ mb: 3, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 4 } }}>
                  <Stack direction="row" spacing={1}>
                    {categories.map((cat) => (
                      <Chip
                        key={cat.id}
                        label={`${cat.label} (${cat.count})`}
                        onClick={() => setSelectedCategory(cat.id)}
                        color={selectedCategory === cat.id ? 'primary' : 'default'}
                        variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 500, borderRadius: 2 }}
                      />
                    ))}
                  </Stack>
                </Box>

                {filteredFAQ.length > 0 ? (
                  <Box>
                    {filteredFAQ.map((faq) => (
                      <StyledAccordion key={faq.question}>
                        <AccordionSummary expandIcon={<ExpandMore color="primary" />}>
                          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                            {faq.question}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                            {faq.answer}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {faq.tags.map((tag) => (
                              <Chip key={tag} label={`#${tag}`} size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', fontSize: '0.7rem' }} />
                            ))}
                          </Stack>
                        </AccordionDetails>
                      </StyledAccordion>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="warning" sx={{ borderRadius: 3 }}>
                    Tidak ada hasil yang ditemukan untuk pencarian Anda.
                  </Alert>
                )}
              </GlassCard>

          {/* Bottom Row: Contact & Resources */}
          {(showContact || resourceLinks.length > 0) && (
          <Grid container spacing={4} alignItems="flex-start">

            {/* Contact Card */}
            {showContact && (
            <Grid size={{ xs: 12, lg: resourceLinks.length > 0 ? 7 : 12 }}>
              <GlassCard variant="glass" sx={{ p: 4, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ContactSupport color="primary" sx={{ mr: 1.5 }} /> Butuh Bantuan Lanjut?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Hubungi Bagian Kemahasiswaan lewat salah satu kontak berikut.
                </Typography>

                <Stack spacing={1.5}>
                  {contactMethods.map((method) => (
                    <Box
                      key={method.type}
                      onClick={method.action}
                      sx={{
                        display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 3,
                        bgcolor: 'background.paper', cursor: 'pointer', transition: 'all 0.2s',
                        border: '1px solid rgba(0,0,0,0.03)',
                        '&:hover': { borderColor: theme.palette.primary.main, transform: 'translateX(4px)' }
                      }}
                    >
                      <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', mr: 2 }}>
                        {method.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>{method.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{method.value}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleEmailSupport}
                  sx={{ mt: 3, borderRadius: 2.5, py: 1.2, fontWeight: 600, boxShadow: theme.shadows[4] }}
                >
                  Kirim Email ke Bagian Kemahasiswaan
                </Button>
              </GlassCard>
            </Grid>
            )}

            {/* Resource Links (URL diatur kampus lewat VITE_USER_MANUAL_URL / VITE_PRIVACY_POLICY_URL) */}
            {resourceLinks.length > 0 && (
            <Grid size={{ xs: 12, lg: showContact ? 5 : 12 }}>
              <GlassCard variant="glass" sx={{ p: 4 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                  Tautan Penting
                </Typography>
                <List dense disablePadding>
                  {resourceLinks.map((link) => (
                    <ListItemButton
                      key={link.key}
                      component="a"
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ borderRadius: 2, mb: 0.5 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{LINK_ICONS[link.key]}</ListItemIcon>
                      <ListItemText primary={link.text} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
                      <OpenInNew fontSize="small" sx={{ color: 'text.disabled' }} />
                    </ListItemButton>
                  ))}
                </List>
              </GlassCard>
            </Grid>
            )}
          </Grid>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default HelpPage;
