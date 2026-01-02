import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/DashboardLayout';

export default function AboutPage() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">About Mustody</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">MUSTODY TECHNOLOGY LTD</h3>
              <p><strong>Company Number:</strong> 14852747</p>
              <p><strong>Company Type:</strong> Private Limited Company</p>
              <p><strong>Incorporated:</strong> 8 May 2023</p>
              <p><strong>Status:</strong> Dissolved (8 October 2024)</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Registered Office Address</h4>
              <p>2nd Floor College House</p>
              <p>17 King Edwards Road</p>
              <p>Ruislip, London</p>
              <p>United Kingdom, HA4 7AE</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Nature of Business (SIC)</h4>
              <p><strong>47910</strong> - Retail sale via mail order houses or via Internet</p>
              <p><strong>62090</strong> - Other information technology service activities</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
