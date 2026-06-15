import React, { useState } from 'react';
import {
  Box, Container, Typography, Button, Grid, Paper, Stack,
  Accordion, AccordionSummary, AccordionDetails, Card, CardContent,
  Chip, Divider, List, ListItem, ListItemIcon, ListItemText,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Avatar, Alert, InputAdornment, Zoom, Fade
} from '@mui/material';
import {
  ArrowBack, ExpandMore, HelpOutline, QuestionAnswer, Book,
  ContactSupport, Phone, Email, LocationOn, Schedule, WhatsApp,
  Telegram, Facebook, Instagram, Search, PlayArrow, Download,
  School, Assignment, Security, AccountCircle, Notifications,
  Settings, BugReport, Feedback, Send, AttachFile
} from '@mui/icons-material';
import { alpha, useTheme, styled } from '@mui/material/styles';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import GlassCard from '../components/ui/GlassCard';

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

const HelpPage = ({ isEmbedded = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [contactDialog, setContactDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [contactForm, setContactForm] = useState({
    name: '', email: '', subject: '', message: '', category: 'umum'
  });

  // FAQ Data
  const faqData = [
    {
      category: 'umum',
      question: 'Apa itu portal pengaduan mahasiswa Universitas Bung Hatta?',
      answer: 'Portal pengaduan adalah platform digital yang memungkinkan mahasiswa untuk menyampaikan keluhan, saran, atau laporan terkait kehidupan kampus seperti fasilitas, akademik, administrasi, dan layanan kampus lainnya secara mudah dan transparan.',
      tags: ['portal', 'pengaduan', 'universitas']
    },
    {
      category: 'umum',
      question: 'Siapa saja yang bisa menggunakan portal ini?',
      answer: 'Portal ini khusus untuk mahasiswa aktif Universitas Bung Hatta. Anda perlu memiliki NIM dan email yang valid untuk dapat mendaftar dan menggunakan layanan ini.',
      tags: ['mahasiswa', 'akses', 'syarat']
    },
    {
      category: 'akun',
      question: 'Bagaimana cara mendaftar akun baru?',
      answer: 'Klik tombol "Daftar" di halaman utama, isi formulir pendaftaran dengan data diri yang valid (nama, email, NIM, fakultas), lalu verifikasi email Anda. Akun akan diaktifkan setelah diverifikasi oleh admin.',
      tags: ['registrasi', 'akun', 'daftar']
    },
    {
      category: 'akun',
      question: 'Saya lupa password, bagaimana cara reset?',
      answer: 'Klik "Lupa Password" di halaman login, masukkan email yang terdaftar. Anda akan menerima link reset password melalui email. Ikuti instruksi dalam email untuk membuat password baru.',
      tags: ['password', 'reset', 'lupa']
    },
    {
      category: 'laporan',
      question: 'Bagaimana cara membuat laporan pengaduan?',
      answer: 'Setelah login, klik "Buat Laporan" di dashboard. Pilih kategori yang sesuai, isi deskripsi masalah secara detail, lampirkan bukti pendukung jika ada, lalu submit. Laporan akan masuk ke sistem untuk diproses.',
      tags: ['laporan', 'pengaduan', 'membuat']
    },
    {
      category: 'laporan',
      question: 'Berapa lama waktu respon untuk laporan saya?',
      answer: 'Tim kami akan merespon laporan dalam waktu maksimal 24 jam kerja. Untuk masalah urgent, biasanya direspon dalam 2-4 jam. Status laporan dapat dipantau melalui dashboard.',
      tags: ['respon', 'waktu', 'status']
    },
    {
      category: 'teknis',
      question: 'Website tidak bisa diakses atau loading lambat',
      answer: 'Coba refresh halaman atau bersihkan cache browser. Pastikan koneksi internet stabil. Jika masih bermasalah, coba akses menggunakan browser lain atau hubungi tim IT.',
      tags: ['website', 'loading', 'akses']
    },
    {
      category: 'privasi',
      question: 'Apakah laporan saya bersifat rahasia?',
      answer: 'Ya, semua laporan dijaga kerahasiaannya. Hanya admin yang berwenang dan pihak terkait yang dapat mengakses detail laporan. Data pribadi Anda dilindungi sesuai kebijakan privasi universitas.',
      tags: ['privasi', 'rahasia', 'keamanan']
    }
  ];

  // Quick Guide Steps
  const quickGuide = [
    { step: 1, title: 'Daftar', description: 'Buat & verifikasi akun Anda', icon: <AccountCircle /> },
    { step: 2, title: 'Masuk', description: 'Akses dasbor mahasiswa', icon: <School /> },
    { step: 3, title: 'Lapor', description: 'Isi form dengan detail', icon: <Assignment /> },
    { step: 4, title: 'Pantau', description: 'Cek status laporan Anda', icon: <Notifications /> }
  ];

  // Contact Methods
  const contactMethods = [
    {
      type: 'whatsapp', title: 'WhatsApp', value: '+62 751 461208',
      description: 'Chat langsung dengan admin', icon: <WhatsApp />,
      action: () => window.open('https://wa.me/6275146120')
    },
    {
      type: 'email', title: 'Email', value: 'pengaduan@bunghatta.ac.id',
      description: 'Respon dalam 24 jam', icon: <Email />,
      action: () => window.open('mailto:pengaduan@bunghatta.ac.id')
    },
    {
      type: 'location', title: 'Lokasi', value: 'Gedung Rektorat Lt. 2',
      description: 'Jl. Bagindo Aziz Chan No. 8, Padang', icon: <LocationOn />,
      action: () => window.open('https://maps.google.com/?q=Universitas+Bung+Hatta+Padang')
    }
  ];

  const categories = [
    { id: 'all', label: 'Semua', count: faqData.length },
    { id: 'umum', label: 'Umum', count: faqData.filter(i => i.category === 'umum').length },
    { id: 'akun', label: 'Akun & Masuk', count: faqData.filter(i => i.category === 'akun').length },
    { id: 'laporan', label: 'Laporan', count: faqData.filter(i => i.category === 'laporan').length },
    { id: 'teknis', label: 'Teknis', count: faqData.filter(i => i.category === 'teknis').length },
    { id: 'privasi', label: 'Privasi', count: faqData.filter(i => i.category === 'privasi').length }
  ];

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContactSubmit = () => {
    setContactDialog(false);
    setContactForm({ name: '', email: '', subject: '', message: '', category: 'umum' });
    alert('Pesan Anda telah dikirim. Tim kami akan merespon segera.');
  };

  const handleInputChange = (field) => (e) => setContactForm(prev => ({ ...prev, [field]: e.target.value }));

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
                    <Grid item xs={6} sm={3} key={guide.step}>
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
                    {filteredFAQ.map((faq, index) => (
                      <StyledAccordion key={index}>
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
                            {faq.tags.map((tag, i) => (
                              <Chip key={i} label={`#${tag}`} size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', fontSize: '0.7rem' }} />
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
          <Grid container spacing={4} alignItems="flex-start">
            
            {/* Contact Card */}
            <Grid item xs={12} lg={7}>
              <GlassCard variant="glass" sx={{ p: 4, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ContactSupport color="primary" sx={{ mr: 1.5 }} /> Butuh Bantuan Lanjut?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Tim dukungan kami selalu siap membantu Anda menyelesaikan masalah.
                </Typography>

                <Stack spacing={1.5}>
                  {contactMethods.map((method, idx) => (
                    <Box 
                      key={idx}
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
                  onClick={() => setContactDialog(true)}
                  sx={{ mt: 3, borderRadius: 2.5, py: 1.2, fontWeight: 600, boxShadow: theme.shadows[4] }}
                >
                  Kirim Tiket Bantuan
                </Button>
              </GlassCard>
            </Grid>

            {/* Resource Links */}
            <Grid item xs={12} lg={5}>
              <GlassCard variant="glass" sx={{ p: 4 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                  Tautan Penting
                </Typography>
                <List dense disablePadding>
                  {[
                    { text: 'Buku Panduan Mahasiswa', icon: <Download /> },
                    { text: 'Kebijakan Privasi', icon: <Security /> },
                    { text: 'Laporkan Bug Sistem', icon: <BugReport /> }
                  ].map((item, i) => (
                    <ListItem key={i} button sx={{ borderRadius: 2, mb: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
                    </ListItem>
                  ))}
                </List>
              </GlassCard>
            </Grid>
          </Grid>
        </Stack>

        {/* Dialog Form */}
        <Dialog 
          open={contactDialog} 
          onClose={() => setContactDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" fontWeight={700}>Kirim Pesan Bantuan</Typography>
            <Typography variant="body2" color="text.secondary">Jelaskan kendala Anda agar kami dapat membantu.</Typography>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField fullWidth label="Nama Lengkap" value={contactForm.name} onChange={handleInputChange('name')} />
              <TextField fullWidth label="Email" type="email" value={contactForm.email} onChange={handleInputChange('email')} />
              <TextField
                fullWidth label="Kategori Kendala" select SelectProps={{ native: true }}
                value={contactForm.category} onChange={handleInputChange('category')}
              >
                <option value="umum">Pertanyaan Umum</option>
                <option value="teknis">Masalah Teknis Website</option>
                <option value="laporan">Masalah Terkait Laporan</option>
              </TextField>
              <TextField fullWidth label="Pesan Detail" multiline rows={4} value={contactForm.message} onChange={handleInputChange('message')} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => setContactDialog(false)} sx={{ borderRadius: 2, px: 3 }}>Batal</Button>
            <Button variant="contained" onClick={handleContactSubmit} sx={{ borderRadius: 2, px: 3 }}>Kirim Pesan</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default HelpPage;