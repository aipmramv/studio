// src/components/shared/PrintableDc.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { KoneLogo } from './KoneLogo';

export interface MaterialItem {
  sno: number;
  description: string;
  quantity: number;
  uom: string;
  value: number;
}

export interface FinalDcData {
  dcNumber: string;
  approvedRequestID: string;
  approvedRequestType: 'Material Movement' | 'Sale Order';
  source: string;
  destination: string;
  materials: MaterialItem[];
  date: string;
  vehicleNumber: string;
  eWayBillRef: string;
  totalValue: number;
}

interface PrintableDcProps {
  dcData: FinalDcData | null;
}

export function PrintableDc({ dcData }: PrintableDcProps) {
  if (!dcData) {
    return null;
  }

  return (
    <div className="printable-dc hidden">
        <div className="p-8 font-sans text-black bg-white">
        <header className="flex justify-between items-start pb-4 border-b-2 border-black">
            <div className="w-1/3">
            <KoneLogo className="h-16 w-auto" />
            </div>
            <div className="w-1/3 text-center">
            <h1 className="text-2xl font-bold">Delivery Challan</h1>
            <p className="text-sm">(Original for Consignee)</p>
            </div>
            <div className="w-1/3 text-right">
            <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`DC No: ${dcData.dcNumber}, Date: ${dcData.date}, Vehicle: ${dcData.vehicleNumber}, Value: ${dcData.totalValue}`)}`}
                alt="QR Code for DC Details"
                width={100}
                height={100}
            />
            </div>
        </header>

        <section className="grid grid-cols-2 gap-4 my-6 text-sm">
            <div className="p-3 border border-black">
                <h2 className="font-bold mb-2">Consignor (From):</h2>
                <p className="font-semibold">R&D Stores (ITEC)</p>
                <p>{dcData.source}</p>
                <p>GSTIN: 29AAAAA0000A1Z5</p>
            </div>
            <div className="p-3 border border-black">
                <h2 className="font-bold mb-2">Consignee (To):</h2>
                <p className="font-semibold">{dcData.destination}</p>
                <p>GSTIN: 29BBBBB0000B2Z4</p>
            </div>
        </section>
        
        <section className="grid grid-cols-3 gap-4 my-6 text-sm">
                <div className="p-2 border border-black"><strong>DC No:</strong> {dcData.dcNumber}</div>
                <div className="p-2 border border-black"><strong>DC Date:</strong> {format(new Date(dcData.date), "dd-MMM-yyyy")}</div>
                <div className="p-2 border border-black"><strong>Vehicle No:</strong> {dcData.vehicleNumber}</div>
        </section>

        <section className="my-6">
            <table className="w-full text-sm text-left border-collapse border border-black">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="p-2 border border-black">S.No.</th>
                        <th className="p-2 border border-black">Description of Goods</th>
                        <th className="p-2 border border-black text-right">Quantity</th>
                        <th className="p-2 border border-black">UOM</th>
                        <th className="p-2 border border-black text-right">Value (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    {dcData.materials.map(item => (
                        <tr key={item.sno}>
                            <td className="p-2 border border-black">{item.sno}</td>
                            <td className="p-2 border border-black">{item.description}</td>
                            <td className="p-2 border border-black text-right">{item.quantity}</td>
                            <td className="p-2 border border-black">{item.uom}</td>
                            <td className="p-2 border border-black text-right">{item.value.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold">
                        <td colSpan={4} className="p-2 border border-black text-right">Total Value:</td>
                        <td className="p-2 border border-black text-right">{dcData.totalValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                    </tr>
                </tfoot>
            </table>
        </section>
        
        <footer className="pt-8 mt-12 text-xs text-gray-600">
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <p className="mb-12">Received the above goods in good condition.</p>
                    <p className="border-t border-gray-400 pt-2">Receiver's Signature & Stamp</p>
                </div>
                    <div>
                    <p className="text-right mb-12">For R&D Stores (ITEC)</p>
                    <p className="border-t border-gray-400 pt-2 text-right">Authorized Signatory</p>
                </div>
            </div>
            <p className="mt-8 text-center">This is a computer-generated challan and does not require a physical signature unless specified.</p>
        </footer>
        </div>
    </div>
  );
}
