// src/lib/request-helpers.tsx
'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Truck, Recycle, ShieldCheck, ShoppingCart, Tags, Package, Hash, CheckCircle, Clock, Circle, X } from 'lucide-react';
import { MOCK_WORKFLOW_TEMPLATES, type RequestType } from './constants';
import { type MaterialMovementFormData, type ScrapMovementFormData, type WorkPermitFormData, type PurchaseOrderFormData, type SaleOrderFormData } from './schemas';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import type { ApprovalItem, RequestPayload } from './mock-data';

export const getRequestTypeIcon = (requestType: RequestType, className?: string) => {
  const props = { className: cn("w-4 h-4 mr-2 text-muted-foreground", className) };
  switch (requestType) {
    case "Material Movement": return <Truck {...props} />;
    case "Scrap Request": return <Recycle {...props} />;
    case "Work Permit": return <ShieldCheck {...props} />;
    case "Purchase Order": return <ShoppingCart {...props} />;
    case "Sale Order": return <Tags {...props} />;
    default: return <Package {...props} />;
  }
};

export const calculateWorkflowProgress = (request: ApprovalItem): number => {
  const workflow = MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === request.workflowTemplateId);
  if (!workflow) return 0;

  const currentStep = workflow.steps.find(s => s.id === request.currentStepId);
  
  // Handle terminal states
  if (request.isVoided || request.currentStepName.toLowerCase().includes('rejected')) {
    return 100;
  }
  
  // If current step is the final step
  if (currentStep && !currentStep.nextStepId) {
    return 100;
  }
  
  // Also check for final step names that don't have a formal stepId in the flow
  if (request.currentStepName.toLowerCase().includes('closed') || request.currentStepName.toLowerCase().includes('issued') || request.currentStepName.toLowerCase().includes('fulfilled') || request.currentStepName.toLowerCase().includes('shipped')) {
      return 100;
  }


  const currentStepIndex = workflow.steps.findIndex(step => step.id === request.currentStepId);
  
  if (currentStepIndex === -1) {
    // If step is not in the main flow (like a closed status), but not explicitly final, treat as complete
    if (request.currentAssignees.length === 0) return 100;
    return 0; // Or some other default if step is unknown
  }

  const progress = ((currentStepIndex + 1) / workflow.steps.length) * 100;
  return Math.min(progress, 100); // Cap at 100
};


export const renderRequestPayloadDetailsDialog = (payload: RequestPayload, requestType: RequestType): ReactNode[] => {
    const details: {key: string, value: string | number | undefined | React.ReactNode }[] = [];
    const currencyFormattingOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 };

    switch (requestType) {
      case "Material Movement":
        const mmPayload = payload as MaterialMovementFormData;
        details.push({ key: "Material Type", value: mmPayload.materialType });
        details.push({ key: "Source", value: mmPayload.source });
        details.push({ key: "Destination", value: mmPayload.destination });
        details.push({ key: "Quantity", value: mmPayload.quantity });
        details.push({ key: "Value", value: mmPayload.value.toLocaleString('en-IN', currencyFormattingOptions) });
        details.push({ key: "Returnable", value: mmPayload.isReturnable });
        if (mmPayload.vehicleNumber) details.push({ key: "Vehicle No.", value: mmPayload.vehicleNumber });
        break;
      case "Scrap Request":
        const smPayload = payload as ScrapMovementFormData;
        details.push({ key: "Scrap Type", value: smPayload.scrapType });
        details.push({ key: "Description", value: <p className="whitespace-pre-wrap">{smPayload.description}</p> });
        details.push({ key: "Quantity", value: smPayload.quantity });
        details.push({ key: "Weight", value: `${smPayload.weight} (units)` });
        if (smPayload.gatePassNumber) details.push({key: "Gate Pass No.", value: <span className='flex items-center'><Hash className='w-3 h-3 mr-1'/>{smPayload.gatePassNumber}</span> });
        break;
      case "Work Permit":
        const wpPayload = payload as WorkPermitFormData;
        details.push({ key: "Building/Location", value: wpPayload.building });
        details.push({ key: "Permit Type/Activity", value: wpPayload.activityType });
        details.push({ key: "Specific Area/Equipment", value: wpPayload.specificAreaOrEquipment });
        details.push({ key: "Activity Details", value: <p className="whitespace-pre-wrap">{wpPayload.activityDetails}</p> });
        if(wpPayload.permitValidity) details.push({ key: "Permit Valid Until", value: new Date(wpPayload.permitValidity).toLocaleDateString() });
        break;
      case "Purchase Order":
        const poPayload = payload as PurchaseOrderFormData;
        if(poPayload.sapOrderNumber) details.push({ key: "SAP PO Number", value: <span className='font-bold text-primary'>{poPayload.sapOrderNumber}</span> });
        details.push({ key: "PO Category", value: poPayload.poCategory });
        details.push({ key: "Department", value: poPayload.department });
        details.push({ key: "Vendor", value: poPayload.vendorName });
        if(poPayload.kmKmgCode) details.push({ key: "KM/KMG Code", value: poPayload.kmKmgCode });
        details.push({ key: "Cost Center", value: poPayload.costCenter });
        details.push({ key: "IO Number", value: poPayload.ioNumber });
        details.push({ key: "PO Date", value: new Date(poPayload.poDate).toLocaleDateString() });
        details.push({ key: "Delivery Address", value: poPayload.deliveryAddress });
        if(poPayload.paymentTerms) details.push({ key: "Payment Terms", value: poPayload.paymentTerms });
        if(poPayload.segment) details.push({ key: "Segment", value: poPayload.segment });

        details.push({ key: "Items", value: (
          <Table className="mt-2 text-xs">
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Price (INR)</TableHead><TableHead>HSN/SAC</TableHead><TableHead className="text-right">GST%</TableHead><TableHead className="text-right">Total (INR)</TableHead></TableRow></TableHeader>
            <TableBody>
            {poPayload.items.map((item, idx) => {
              const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
              const itemGst = itemTotal * ((item.gstPercentage || 0) / 100);
              const lineTotal = itemTotal + itemGst;
              return (
              <TableRow key={idx}><TableCell>{item.itemName}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{item.unitPrice.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell><TableCell>{item.hsnSacCode || 'N/A'}</TableCell><TableCell className="text-right">{item.gstPercentage ? `${item.gstPercentage}%` : 'N/A'}</TableCell><TableCell className="text-right">{lineTotal.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell></TableRow>
              );
            })}
            </TableBody>
             <TableFooter><TableRow><TableCell colSpan={5} className="text-right font-bold">Grand Total (INR)</TableCell><TableCell className="text-right font-bold">{poPayload.items.reduce((sum, i) => {
                const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
                const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
                return sum + itemTotal + itemGst;
             }, 0).toLocaleString('en-IN', currencyFormattingOptions)}</TableCell></TableRow></TableFooter>
          </Table>
        )});
        if(poPayload.remarks) details.push({ key: "Remarks", value: <p className="whitespace-pre-wrap">{poPayload.remarks}</p> });
        break;
      case "Sale Order":
        const soPayload = payload as SaleOrderFormData;
        if(soPayload.sapOrderNumber) details.push({ key: "SAP SO Number", value: <span className='font-bold text-primary'>{soPayload.sapOrderNumber}</span> });
        details.push({ key: "Customer", value: soPayload.customerName });
        details.push({ key: "SO Date", value: new Date(soPayload.soDate).toLocaleDateString() });
        details.push({ key: "Project/CR No.", value: soPayload.projectOrCrNo });
        details.push({ key: "SO Category", value: soPayload.saleOrderCategory });
        details.push({ key: "Purpose", value: <p className="whitespace-pre-wrap">{soPayload.purpose}</p> });
        details.push({ key: "Cost Center", value: soPayload.costCenter });
        details.push({ key: "IO Number", value: soPayload.ioNumber });
        details.push({ key: "Budget Amount", value: soPayload.budgetAmount.toLocaleString('en-IN', currencyFormattingOptions) });
        details.push({ key: "Material Req. Date", value: new Date(soPayload.materialRequiredDate).toLocaleDateString() });
        details.push({ key: "Dept. Head Approval", value: soPayload.departmentHeadApproval });
        details.push({ key: "Delivery To", value: soPayload.deliveryTo });
         details.push({ key: "Items", value: (
            <Table className="mt-2 text-xs">
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Price (INR)</TableHead><TableHead>HSN/SAC</TableHead><TableHead className="text-right">GST%</TableHead><TableHead className="text-right">Total (INR)</TableHead></TableRow></TableHeader>
            <TableBody>
            {soPayload.items.map((item, idx) => {
              const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
              const itemGst = itemTotal * ((item.gstPercentage || 0) / 100);
              const lineTotal = itemTotal + itemGst;
              return(
              <TableRow key={idx}><TableCell>{item.itemName}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{item.unitPrice.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell><TableCell>{item.hsnSacCode || 'N/A'}</TableCell><TableCell className="text-right">{item.gstPercentage ? `${item.gstPercentage}%` : 'N/A'}</TableCell><TableCell className="text-right">{lineTotal.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell></TableRow>
              );
            })}
            </TableBody>
            <TableFooter><TableRow><TableCell colSpan={5} className="text-right font-bold">Grand Total (INR)</TableCell><TableCell className="text-right font-bold">{soPayload.items.reduce((sum, i) => {
                const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
                const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
                return sum + itemTotal + itemGst;
            }, 0).toLocaleString('en-IN', currencyFormattingOptions)}</TableCell></TableRow></TableFooter>
          </Table>
        )});
        if(soPayload.remarks) details.push({ key: "Remarks", value: <p className="whitespace-pre-wrap">{soPayload.remarks}</p> });
        break;
      default:
        details.push({ key: "Details", value: "No specific details available for this request type." });
    }
    return details.map(detail => (
      <div key={detail.key} className="text-sm">
        <span className="capitalize font-medium text-foreground">{detail.key}: </span><span className="text-muted-foreground">{typeof detail.value === 'string' || typeof detail.value === 'number' ? detail.value : <div className="mt-1">{detail.value}</div>}</span>
      </div>
    ));
  };

export const renderWorkflowProgress = (request: ApprovalItem): ReactNode => {
    const workflow = MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === request.workflowTemplateId);
    if (!workflow) return <p className="text-sm text-muted-foreground">Workflow details not available.</p>;

    const currentStepIndex = workflow.steps.findIndex(step => step.id === request.currentStepId);

    return (
      <div className="space-y-0">
        {workflow.steps.map((step, index) => {
          const historyForStep = request.history.filter(h => h.stepId === step.id && h.action === "approve");
          const isCompleted = historyForStep.length > 0 || index < currentStepIndex;
          const isCurrent = step.id === request.currentStepId && !isCompleted;
          const isVoidedOrRejected = request.currentStepName === "Request Voided" || request.currentStepName === "Request Rejected";


          let icon;
          let textClass = "text-muted-foreground/80";
          let roleClass = "text-muted-foreground/80";
          let lineClass = "bg-border";

          if (isVoidedOrRejected && step.id === request.currentStepId) {
             icon = <X className="w-5 h-5 text-destructive" />;
             textClass = "text-destructive font-semibold";
             roleClass = "text-destructive";
             lineClass = "bg-destructive";
          } else if (isCompleted) {
            icon = <CheckCircle className="w-5 h-5 text-primary" />;
            textClass = "text-primary";
            roleClass = "text-primary";
            lineClass = "bg-primary";
          } else if (isCurrent) {
            icon = <Clock className="w-5 h-5 text-[hsl(var(--chart-2))] animate-pulse" />;
            textClass = "text-[hsl(var(--chart-2))] font-semibold";
            roleClass = "text-[hsl(var(--chart-2))]";
            lineClass = "bg-[hsl(var(--chart-2))]";
          } else {
            icon = <Circle className="w-5 h-5 text-muted-foreground/60" />;
          }

          const isInitialCurrentStep = isCurrent && index === 0 && request.history.every(h => h.stepId === step.id ? (h.action === "system_auto_proceed" || h.action === "submitted") : true);
          if(isInitialCurrentStep && !isCompleted && !isVoidedOrRejected) {
             lineClass = "bg-[hsl(var(--chart-2))]";
          }


          return (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center mr-4">
                {icon}
                {index < workflow.steps.length - 1 && (
                  <div className={cn( "w-px h-10 mt-1", lineClass )} />
                )}
              </div>
              <div className={cn("pb-10", index === workflow.steps.length -1 && "pb-0")}>
                <p className={cn("text-sm", textClass)}>{step.name}</p>
                <p className={cn("text-xs", roleClass)}>
                  Assigned: {step.assignedRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, ' ')).join(', ')}
                </p>
                 {isCompleted && historyForStep[0]?.timestamp && (
                  <p className="text-xs text-muted-foreground">Completed: {new Date(historyForStep[0].timestamp).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };


export const renderRequestSummary = (item: ApprovalItem): string => {
  const { requestType, payload } = item;
  const currencyFormattingOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 };

  switch (requestType) {
    case "Material Movement":
      const mm = payload as MaterialMovementFormData;
      return `Move ${mm.quantity} x ${mm.materialType} from ${mm.source} to ${mm.destination}. Value: ${mm.value.toLocaleString('en-IN', currencyFormattingOptions)}`;
    case "Scrap Request":
      const sm = payload as ScrapMovementFormData;
      return `${sm.quantity} units of ${sm.scrapType} (${sm.weight} units weight). Desc: ${sm.description.substring(0,50)}... ${sm.gatePassNumber ? `GP: ${sm.gatePassNumber}` : ''}`;
    case "Work Permit":
      const wp = payload as WorkPermitFormData;
      return `For ${wp.activityType} in ${wp.building}. Area: ${wp.specificAreaOrEquipment}. Details: ${wp.activityDetails.substring(0,30)}...`;
    case "Purchase Order":
      const po = payload as PurchaseOrderFormData;
      const poTotal = po.items.reduce((sum, i) => {
        const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
        const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
        return sum + itemTotal + itemGst;
      }, 0);
      return `Vendor: ${po.vendorName}. ${po.items.length} item(s). Total: ${poTotal.toLocaleString('en-IN', currencyFormattingOptions)}`;
    case "Sale Order":
      const so = payload as SaleOrderFormData;
      const soTotal = so.items.reduce((sum, i) => {
        const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
        const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
        return sum + itemTotal + itemGst;
      }, 0);
      return `Customer: ${so.customerName}. ${so.items.length} item(s). Total: ${soTotal.toLocaleString('en-IN', currencyFormattingOptions)}`;
    default:
      return "Details not available.";
  }
};
