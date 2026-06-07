import React from "react";
import { Box } from "@mui/material";
import Footer from "../components/footer"; 
import Header from "../components/header";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        bgcolor: 'background.default',
        overflow: 'hidden' // Prevent horizontal scroll
      }}
    >
      <Header />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          // Better spacing and proportions
          minHeight: 'calc(100vh - 140px)', // Account for header/footer
          '& > *': {
            width: '100%'
          }
        }}
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}