import React from 'react';
import { TextField, MenuItem, Box } from '@mui/material';

const countryCodes = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'GB', flag: '🇬🇧' },
  { code: '+90', country: 'TR', flag: '🇹🇷' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+46', country: 'SE', flag: '🇸🇪' },
  { code: '+47', country: 'NO', flag: '🇳🇴' },
  { code: '+45', country: 'DK', flag: '🇩🇰' },
  { code: '+41', country: 'CH', flag: '🇨🇭' },
  { code: '+43', country: 'AT', flag: '🇦🇹' },
  { code: '+32', country: 'BE', flag: '🇧🇪' },
  { code: '+351', country: 'PT', flag: '🇵🇹' },
  { code: '+30', country: 'GR', flag: '🇬🇷' },
  { code: '+48', country: 'PL', flag: '🇵🇱' },
  { code: '+420', country: 'CZ', flag: '🇨🇿' },
  { code: '+36', country: 'HU', flag: '🇭🇺' },
  { code: '+40', country: 'RO', flag: '🇷🇴' },
  { code: '+359', country: 'BG', flag: '🇧🇬' },
  { code: '+385', country: 'HR', flag: '🇭🇷' },
  { code: '+386', country: 'SI', flag: '🇸🇮' },
  { code: '+421', country: 'SK', flag: '🇸🇰' },
  { code: '+372', country: 'EE', flag: '🇪🇪' },
  { code: '+371', country: 'LV', flag: '🇱🇻' },
  { code: '+370', country: 'LT', flag: '🇱🇹' },
  { code: '+358', country: 'FI', flag: '🇫🇮' },
  { code: '+7', country: 'RU', flag: '🇷🇺' },
  { code: '+380', country: 'UA', flag: '🇺🇦' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+64', country: 'NZ', flag: '🇳🇿' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+54', country: 'AR', flag: '🇦🇷' },
  { code: '+56', country: 'CL', flag: '🇨🇱' },
  { code: '+57', country: 'CO', flag: '🇨🇴' },
  { code: '+51', country: 'PE', flag: '🇵🇪' },
  { code: '+58', country: 'VE', flag: '🇻🇪' },
  { code: '+27', country: 'ZA', flag: '🇿🇦' },
  { code: '+20', country: 'EG', flag: '🇪🇬' },
  { code: '+234', country: 'NG', flag: '🇳🇬' },
  { code: '+254', country: 'KE', flag: '🇰🇪' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
  { code: '+966', country: 'SA', flag: '🇸🇦' },
  { code: '+965', country: 'KW', flag: '🇰🇼' },
  { code: '+974', country: 'QA', flag: '🇶🇦' },
  { code: '+973', country: 'BH', flag: '🇧🇭' },
  { code: '+968', country: 'OM', flag: '🇴🇲' },
  { code: '+962', country: 'JO', flag: '🇯🇴' },
  { code: '+961', country: 'LB', flag: '🇱🇧' },
  { code: '+60', country: 'MY', flag: '🇲🇾' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+66', country: 'TH', flag: '🇹🇭' },
  { code: '+84', country: 'VN', flag: '🇻🇳' },
  { code: '+63', country: 'PH', flag: '🇵🇭' },
  { code: '+62', country: 'ID', flag: '🇮🇩' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  label?: string;
  fullWidth?: boolean;
}

export default function PhoneInput({ 
  value, 
  onChange, 
  error, 
  helperText, 
  label = "Phone Number",
  fullWidth = true 
}: PhoneInputProps) {
  // Parse existing phone number
  const parsePhone = (phone: string) => {
    if (!phone) return { countryCode: '+90', number: '' };
    
    const country = countryCodes.find(c => phone.startsWith(c.code));
    if (country) {
      return {
        countryCode: country.code,
        number: phone.substring(country.code.length)
      };
    }
    return { countryCode: '+90', number: phone };
  };

  const { countryCode, number } = parsePhone(value);

  const handleCountryChange = (newCountryCode: string) => {
    onChange(newCountryCode + number);
  };

  const handleNumberChange = (newNumber: string) => {
    // Remove non-numeric characters
    const cleanNumber = newNumber.replace(/\D/g, '');
    onChange(countryCode + cleanNumber);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        select
        value={countryCode}
        onChange={(e) => handleCountryChange(e.target.value)}
        sx={{ minWidth: 120 }}
        error={error}
      >
        {countryCodes.map((country) => (
          <MenuItem key={country.code} value={country.code}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{country.flag}</span>
              <span>{country.code}</span>
            </Box>
          </MenuItem>
        ))}
      </TextField>
      
      <TextField
        fullWidth={fullWidth}
        label={label}
        value={number}
        onChange={(e) => handleNumberChange(e.target.value)}
        error={error}
        helperText={helperText}
        placeholder="5XX XXX XX XX"
        inputProps={{
          maxLength: 15
        }}
      />
    </Box>
  );
}

export const validatePhoneNumber = (phone: string): { isValid: boolean; message: string } => {
  if (!phone) {
    return { isValid: false, message: 'Phone number is required' };
  }

  const country = countryCodes.find(c => phone.startsWith(c.code));
  if (!country) {
    return { isValid: false, message: 'Invalid country code' };
  }

  const number = phone.substring(country.code.length);
  
  // Basic validation - at least 7 digits, max 15
  if (number.length < 7) {
    return { isValid: false, message: 'Phone number too short' };
  }
  
  if (number.length > 15) {
    return { isValid: false, message: 'Phone number too long' };
  }

  // Check if contains only digits
  if (!/^\d+$/.test(number)) {
    return { isValid: false, message: 'Phone number must contain only digits' };
  }

  // Turkey specific validation
  if (country.code === '+90') {
    if (number.length !== 10) {
      return { isValid: false, message: 'Turkish phone number must be 10 digits' };
    }
    if (!number.startsWith('5')) {
      return { isValid: false, message: 'Turkish mobile number must start with 5' };
    }
  }

  return { isValid: true, message: '' };
};
