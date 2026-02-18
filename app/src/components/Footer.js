import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-industrial-900 text-industrial-300 py-12 border-t border-industrial-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">WasteWise</h3>
            <p className="text-sm leading-relaxed">
              Sri Lanka's first industrial circular economy platform. 
              Connecting garment factories with recyclers to turn waste into resource.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/marketplace" className="hover:text-nature-400">Marketplace</a></li>
              <li><a href="#" className="hover:text-nature-400">Compliance</a></li>
              <li><a href="#" className="hover:text-nature-400">Logistics</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-nature-400">About Us</a></li>
              <li><a href="#" className="hover:text-nature-400">Impact Reports</a></li>
              <li><a href="#" className="hover:text-nature-400">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-nature-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-nature-400">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-industrial-800 text-sm text-center">
          &copy; 2026 WasteWise Sri Lanka. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
