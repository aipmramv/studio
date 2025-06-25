// src/components/shared/PrintableWorkPermit.tsx
"use client";

import React from 'react';
import { format } from 'date-fns';
import { KoneLogo } from './KoneLogo';
import type { WorkPermitDisplayItem } from '@/app/(app)/work-permit/list/page';

interface PrintableWorkPermitProps {
  permitData: WorkPermitDisplayItem | null;
}

export function PrintableWorkPermit({ permitData }: PrintableWorkPermitProps) {
  if (!permitData) {
    return null;
  }

  const { payload, history } = permitData;

  const approvalHistory = history.filter(h => h.action === 'approve');

  return (
    <div className="printable-wp hidden">
      <div className="p-8 font-sans text-black bg-white space-y-6">
        <header className="flex justify-between items-center pb-4 border-b-2 border-black">
          <div className="w-1/4">
            <KoneLogo className="h-12 w-auto" />
          </div>
          <div className="w-2/4 text-center">
            <h1 className="text-3xl font-bold uppercase tracking-wider">Work Permit</h1>
            <p className="text-lg">Permit to Work System</p>
          </div>
          <div className="w-1/4 text-right">
            <p className="font-semibold">Permit No: <span className="font-normal">{permitData.id}</span></p>
          </div>
        </header>

        <section className="border border-black p-4">
          <h2 className="text-xl font-bold mb-4 text-center">Section 1: Permit Details</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-base">
            <div><strong className="text-gray-600">Requester:</strong> {permitData.requesterName}</div>
            <div><strong className="text-gray-600">Department:</strong> {permitData.requesterDepartment}</div>
            <div><strong className="text-gray-600">Submission Date:</strong> {format(new Date(permitData.submissionDate), 'dd-MMM-yyyy HH:mm')}</div>
            {payload.permitValidity && <div><strong className="text-gray-600">Permit Valid Until:</strong> {format(new Date(payload.permitValidity), 'dd-MMM-yyyy')}</div>}
            <div className="col-span-2"><strong className="text-gray-600">Building/Location:</strong> {payload.building}</div>
            <div className="col-span-2"><strong className="text-gray-600">Specific Area/Equipment:</strong> {payload.specificAreaOrEquipment}</div>
            <div className="col-span-2"><strong className="text-gray-600">Activity/Permit Type:</strong> {payload.activityType}</div>
            <div className="col-span-2">
                <strong className="text-gray-600">Scope of Work:</strong>
                <p className="mt-1 p-2 border bg-gray-50 rounded-md whitespace-pre-wrap">{payload.activityDetails}</p>
            </div>
          </div>
        </section>

        <section className="border border-black p-4">
          <h2 className="text-xl font-bold mb-4 text-center">Section 2: Approvals</h2>
           <table className="w-full text-sm text-left">
              <thead className="bg-gray-200">
                  <tr>
                      <th className="p-2 border border-black">Step Name</th>
                      <th className="p-2 border border-black">Approved By</th>
                      <th className="p-2 border border-black">Timestamp</th>
                      <th className="p-2 border border-black">Comments</th>
                  </tr>
              </thead>
              <tbody>
                  {approvalHistory.map((entry, index) => (
                      <tr key={index}>
                          <td className="p-2 border border-black font-semibold">{entry.stepName}</td>
                          <td className="p-2 border border-black">{entry.actor}</td>
                          <td className="p-2 border border-black">{format(new Date(entry.timestamp), 'dd-MMM-yyyy HH:mm')}</td>
                          <td className="p-2 border border-black italic">{entry.comment || "N/A"}</td>
                      </tr>
                  ))}
              </tbody>
           </table>
        </section>
        
        <section className="border border-black p-4">
            <h2 className="text-xl font-bold mb-4 text-center">Section 3: Completion & Closeout</h2>
            <div className="grid grid-cols-2 gap-8 mt-8">
                 <div>
                    <p className="mb-16">Work completed and area left in safe condition.</p>
                    <p className="border-t border-gray-400 pt-2 font-semibold">Requester/Worker Signature</p>
                </div>
                 <div>
                    <p className="mb-16">Verified work completion and closed permit.</p>
                    <p className="border-t border-gray-400 pt-2 font-semibold">Issuing Authority Signature</p>
                </div>
            </div>
        </section>

        <footer className="pt-4 mt-4 text-center text-xs text-gray-500">
            This is a system-generated document from the R&D Stores Flow application.
        </footer>
      </div>
    </div>
  );
}
