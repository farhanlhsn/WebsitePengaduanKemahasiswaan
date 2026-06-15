import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  Avatar,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating
} from '@mui/material';
import { 
  HowToReg, 
  RateReview, 
  FactCheck, 
  GppGood,
  AccountBox,
  ReportProblem,
  Security,
  Speed,
  GroupWork,
  ArrowForward,
  Verified,
  TrendingUp,
  Schedule,
  CheckCircle,
  ExpandMore,
  Star,
  FormatQuote,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  Assignment,
  People
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import UBHLogo from '../components/ui/UBHLogo';

const steps = [
  {
    icon: <HowToReg fontSize="large" color="primary" />,
    title: '1. Registrasi & Login',
    description: 'Daftarkan diri Anda dengan data yang valid. Akun Anda akan diverifikasi oleh admin.',
  },
  {
    icon: <RateReview fontSize="large" color="primary" />,
    title: '2. Buat Laporan',
    description: 'Tulis laporan Anda secara jelas dan rinci, lalu sertakan bukti pendukung jika ada.',
  },
  {
    icon: <FactCheck fontSize="large" color="primary" />,
    title: '3. Verifikasi & Tindak Lanjut',
    description: 'Laporan akan direview dan ditindaklanjuti oleh pihak berwenang sesuai dengan kategori laporan.',
  },
  {
    icon: <GppGood fontSize="large" color="primary" />,
    title: '4. Pantau & Selesai',
    description: 'Anda dapat memantau status laporan Anda melalui dashboard hingga masalah terselesaikan.',
  },
];

const features = [
  {
    icon: <Security color="primary" sx={{ fontSize: 40 }} />,
    title: "Aman & Terpercaya",
    description: "Data dan identitas Anda terjaga dengan sistem keamanan berlapis dan enkripsi end-to-end"
  },
  {
    icon: <Speed color="primary" sx={{ fontSize: 40 }} />,
    title: "Respon Cepat",
    description: "Tim kami siap merespon laporan Anda dalam waktu maksimal 24 jam kerja"
  },
  {
    icon: <GroupWork color="primary" sx={{ fontSize: 40 }} />,
    title: "Tindak Lanjut",
    description: "Setiap laporan akan ditindaklanjuti hingga mencapai solusi terbaik dengan transparansi penuh"
  }
];

const statistics = [
  {
    icon: <Assignment />,
    label: "Total Laporan",
    value: "1,247",
    description: "Laporan yang telah diterima"
  },
  {
    icon: <CheckCircle />,
    label: "Terselesaikan",
    value: "1,089",
    description: "Laporan yang telah diselesaikan"
  },
  {
    icon: <TrendingUp />,
    label: "Tingkat Kepuasan",
    value: "94%",
    description: "Mahasiswa merasa puas"
  },
  {
    icon: <People />,
    label: "Pengguna Aktif",
    value: "2,841",
    description: "Mahasiswa terdaftar"
  }
];

const testimonials = [
  {
    name: "Sarah Maharani",
    program: "Teknik Informatika",
    rating: 5,
    comment: "Sangat mudah digunakan dan responnya cepat. Masalah akademik saya ditangani dengan baik oleh tim.",
    avatar: "SM"
  },
  {
    name: "Ahmad Fauzi",
    program: "Manajemen",
    rating: 5,
    comment: "Platform yang sangat membantu! Keluhan saya tentang fasilitas kampus langsung ditindaklanjuti.",
    avatar: "AF"
  },
  {
    name: "Dita Sari",
    program: "Psikologi",
    rating: 4,
    comment: "Interface yang user-friendly dan proses yang transparan. Terima kasih Universitas Bung Hatta!",
    avatar: "DS"
  }
];

const faqs = [
  {
    question: "Siapa saja yang bisa menggunakan layanan ini?",
    answer: "Layanan ini dapat digunakan oleh seluruh mahasiswa aktif Universitas Bung Hatta yang telah memiliki NIM resmi."
  },
  {
    question: "Berapa lama waktu yang dibutuhkan untuk mendapat respons?",
    answer: "Tim kami berkomitmen untuk merespons setiap laporan dalam waktu maksimal 24 jam pada hari kerja."
  },
  {
    question: "Apakah identitas saya akan terjaga kerahasiaannya?",
    answer: "Ya, kami menjamin kerahasiaan data pribadi Anda. Hanya pihak berwenang yang akan menangani laporan Anda."
  },
  {
    question: "Apa saja kategori laporan yang bisa diajukan?",
    answer: "Anda dapat melaporkan masalah akademik, fasilitas, administrasi, atau hal lain yang berkaitan dengan kehidupan kampus."
  },
  {
    question: "Bagaimana cara memantau status laporan saya?",
    answer: "Setelah login, Anda dapat memantau status laporan melalui dashboard pribadi Anda dengan update real-time."
  }
];

export default function HomePage() {
  const theme = useTheme();
  const [expandedFaq, setExpandedFaq] = useState(false);

  const handleFaqChange = (panel) => (event, isExpanded) => {
    setExpandedFaq(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Hero Section */}
      <Box sx={{ 
        minHeight: { xs: '80vh', md: '85vh' },
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 8, md: 12 },
        px: { xs: 2, md: 4 },
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.light, 0.1)} 0%, 
          ${alpha(theme.palette.secondary.light, 0.15)} 50%,
          ${alpha(theme.palette.primary.light, 0.1)} 100%)`
      }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '4fr 3fr' },
            gap: { xs: 4, lg: 8 },
            alignItems: 'center'
          }}>
            <Box sx={{ textAlign: { xs: 'center', lg: 'left' } }}>
              <Chip 
                icon={<Verified />}
                label="Platform Resmi UBH" 
                color="primary" 
                variant="outlined"
                sx={{ 
                  mb: 3,
                  fontSize: '0.9rem', 
                  py: 2, 
                  px: 3,
                  backdropFilter: 'blur(10px)',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }}
              />
              
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{ 
                  fontWeight: 800,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em'
                }}
              >
                Suara Anda,<br />Perubahan Nyata
              </Typography>
              
              <Typography 
                variant="h5" 
                color="text.secondary" 
                sx={{ 
                  mb: 4, 
                  maxWidth: { xs: '100%', lg: 600 }, 
                  mx: { xs: 'auto', lg: 0 },
                  lineHeight: 1.6,
                  fontWeight: 400,
                  fontSize: { xs: '1.1rem', md: '1.3rem' }
                }}
              >
                Platform pengaduan mahasiswa yang menghubungkan aspirasi Anda dengan solusi konkret untuk kemajuan bersama
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: { xs: 'column', sm: 'row' },
                mb: 4,
                justifyContent: { xs: 'center', lg: 'flex-start' }
              }}>
                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  size="large"
                  startIcon={<ReportProblem />}
                  sx={{ 
                    px: 4, 
                    py: 2,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.5)}`,
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Buat Laporan Sekarang
                </Button>
              </Box>

              {/* Quick Stats */}
              <Box sx={{ 
                display: 'flex', 
                gap: 4, 
                justifyContent: { xs: 'center', lg: 'flex-start' },
                flexWrap: 'wrap'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    1,247
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Laporan
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    94%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tingkat Kepuasan
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    24h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Waktu Respon
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 6,
                  maxWidth: 400,
                  width: '100%',
                  background: `linear-gradient(145deg, 
                    ${alpha(theme.palette.background.paper, 0.9)}, 
                    ${alpha(theme.palette.background.paper, 0.95)})`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.1)}`,
                  transform: 'perspective(1000px) rotateY(-5deg)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateY(0deg) translateY(-10px)',
                  }
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <UBHLogo
                    size="hero"
                    style={{ 
                      margin: '0 auto 16px auto',
                      display: 'block',
                      filter: `drop-shadow(0 8px 20px ${alpha(theme.palette.primary.main, 0.3)})`
                    }}
                    loading="eager"
                  />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Universitas Bung Hatta
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gedung Rektorat, Kampus Utama
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ space: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Schedule color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Jam Operasional
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        24/7 Online Support
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Hotline
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (0751) 461208
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Email color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Email Support
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        pengaduan@bunghatta.ac.id
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Statistics Section */}
      <Box sx={{ 
        py: { xs: 8, md: 10 },
        px: { xs: 2, md: 4 },
        background: alpha(theme.palette.primary.main, 0.02)
      }}>
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3
          }}>
            {statistics.map((stat) => (
              <Paper
                key={stat.label}
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 4,
                  background: `linear-gradient(145deg, 
                    ${alpha(theme.palette.background.paper, 0.8)}, 
                    ${alpha(theme.palette.background.paper, 0.9)})`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
                  {stat.value}
                </Typography>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Process Steps Section */}
      <Box sx={{ 
        py: { xs: 8, md: 10 },
        px: { xs: 2, md: 4 },
        background: alpha(theme.palette.grey[50], 0.5)
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                fontSize: { xs: '1.8rem', md: '2.5rem' }
              }}
            >
              Alur Proses Pengaduan
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Proses yang mudah dan transparan untuk memastikan keluhan Anda ditangani dengan baik
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 4
          }}>
            {steps.map((step, index) => (
              <Paper
                key={step.title}
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  position: 'relative',
                  borderRadius: 4,
                  background: `linear-gradient(145deg, 
                    ${alpha(theme.palette.background.paper, 0.9)}, 
                    ${alpha(theme.palette.background.paper, 0.95)})`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                  }
                }}
              >
                {/* Step Number Badge */}
                <Box sx={{
                  position: 'absolute',
                  top: -15,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  {index + 1}
                </Box>
                
                <Box sx={{ mb: 2, mt: 2 }}>
                  {step.icon}
                </Box>
                <Typography variant="h6" component="h3" sx={{ 
                  mb: 2, 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                  lineHeight: 1.6,
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }}>
                  {step.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ 
        py: { xs: 8, md: 10 },
        px: { xs: 2, md: 4 }
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                fontSize: { xs: '1.8rem', md: '2.5rem' }
              }}
            >
              Mengapa Memilih Layanan Kami?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Komitmen kami untuk memberikan pelayanan terbaik bagi mahasiswa UBH
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 4
          }}>
            {features.map((feature) => (
              <Paper
                key={feature.title}
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 4,
                  background: `linear-gradient(145deg, 
                    ${alpha(theme.palette.background.paper, 0.8)}, 
                    ${alpha(theme.palette.background.paper, 0.9)})`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 15px 30px ${alpha(theme.palette.primary.main, 0.2)}`,
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: 72,
                    height: 72,
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography variant="h6" component="h3" sx={{ 
                  mb: 2, 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{
                  lineHeight: 1.6,
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }}>
                  {feature.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ 
        py: { xs: 8, md: 10 },
        px: { xs: 2, md: 4 },
        background: alpha(theme.palette.primary.main, 0.02)
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                fontSize: { xs: '1.8rem', md: '2.5rem' }
              }}
            >
              Apa Kata Mahasiswa?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Pengalaman nyata dari mahasiswa yang telah menggunakan layanan kami
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 4
          }}>
            {testimonials.map((testimonial) => (
              <Card 
                key={testimonial.name}
                elevation={0}
                sx={{ 
                  borderRadius: 4,
                  background: `linear-gradient(145deg, 
                    ${alpha(theme.palette.background.paper, 0.9)}, 
                    ${alpha(theme.palette.background.paper, 0.95)})`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 15px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
                  }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar 
                      sx={{ 
                        width: 56, 
                        height: 56, 
                        mr: 2,
                        bgcolor: 'primary.main',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {testimonial.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.program}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Rating 
                    value={testimonial.rating} 
                    readOnly 
                    sx={{ mb: 2 }}
                    size="small"
                  />
                  
                  <Box sx={{ position: 'relative' }}>
                    <FormatQuote 
                      sx={{ 
                        position: 'absolute',
                        top: -10,
                        left: -10,
                        fontSize: 40,
                        color: alpha(theme.palette.primary.main, 0.2),
                        transform: 'rotate(180deg)'
                      }} 
                    />
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontStyle: 'italic',
                        lineHeight: 1.6,
                        pl: 3
                      }}
                    >
                      {testimonial.comment}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box sx={{ 
        py: { xs: 8, md: 10 },
        px: { xs: 2, md: 4 }
      }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                fontSize: { xs: '1.8rem', md: '2.5rem' }
              }}
            >
              Pertanyaan yang Sering Diajukan
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Temukan jawaban atas pertanyaan umum tentang layanan kami
            </Typography>
          </Box>
          
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                expanded={expandedFaq === `panel${index}`}
                onChange={handleFaqChange(`panel${index}`)}
                elevation={0}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  background: `linear-gradient(145deg, 
                    ${alpha(theme.palette.background.paper, 0.8)}, 
                    ${alpha(theme.palette.background.paper, 0.9)})`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  '&:before': {
                    display: 'none',
                  },
                  '&.Mui-expanded': {
                    margin: '0 0 16px 0',
                    boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    borderRadius: 3,
                    '& .MuiAccordionSummary-content': {
                      margin: '16px 0',
                    },
                  }}
                >
                  <Typography variant="h6" fontWeight="600">
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>
    </Box>
  );
}