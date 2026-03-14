'use client';

import { useState } from 'react';
import { Bluetooth, Loader2 } from 'lucide-react';
import { type Bill } from '@/lib/validations';
import { formatCurrency } from '@/lib/calculations';

interface BluetoothPrintButtonProps {
    bill: Bill;
    companyName: string;
}

export function BluetoothPrintButton({ bill, companyName }: BluetoothPrintButtonProps) {
    const [isPrinting, setIsPrinting] = useState(false);
    const [statusText, setStatusText] = useState('');

    const fmt = formatCurrency;

    // Helper: Formats a line of text for 32-character ESC/POS (standard 58mm width)
    const formatLine = (left: string, right: string) => {
        const totalWidth = 32;
        const spacesNeeded = totalWidth - left.length - right.length;
        if (spacesNeeded <= 0) return left.substring(0, totalWidth - right.length - 1) + ' ' + right;
        return left + ' '.repeat(spacesNeeded) + right;
    };

    const handleBluetoothPrint = async () => {
        try {
            setIsPrinting(true);
            setStatusText('Requesting Device...');

            // 1. Request Bluetooth Device (Filtering for common generic printer services + SPP)
            // Note: Many generic Chinese PT-210 printers use the common UUID '000018f0-0000-1000-8000-00805f9b34fb' or similar for BLE Printing
            if (!navigator.bluetooth) {
                alert("Web Bluetooth is not supported on this browser/device. Please use Google Chrome on Android, or print via the OS Print Dialog using RawBT.");
                setIsPrinting(false);
                setStatusText('');
                return;
            }

            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
                optionalServices: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2', '0000ae30-0000-1000-8000-00805f9b34fb']
            });

            setStatusText('Connecting...');
            const server = await device.gatt?.connect();
            
            if (!server) throw new Error("Could not connect to GATT Server");

            // Look for generic printer service UUIDs
            const services = await server.getPrimaryServices();
            if (services.length === 0) throw new Error("No print services found");
            const service = services[0];
            
            const characteristics = await service.getCharacteristics();
            const characteristic = characteristics.find((c: BluetoothRemoteGATTCharacteristic) => c.properties.write || c.properties.writeWithoutResponse);
            
            if (!characteristic) throw new Error("No writable characteristics found");

            setStatusText('Printing...');

            // 2. Format Receipt Data (Basic Text format, max 32 chars per line for 58mm)
            const encoder = new TextEncoder();
            
            // ESC/POS Commands
            const INIT = '\x1B\x40'; // Initialize printer
            const BOLD_ON = '\x1B\x45\x01';
            const BOLD_OFF = '\x1B\x45\x00';
            const CENTER = '\x1B\x61\x01';
            const LEFT = '\x1B\x61\x00';
            const NL = '\n';

            // Build Receipt String
            let receipt = INIT + CENTER + BOLD_ON + companyName + BOLD_OFF + NL;
            receipt += "CASH RECEIPT" + NL + NL;
            receipt += LEFT;
            receipt += `NO : ${bill.billNumber}` + NL;
            receipt += `DATE    : ${new Date(bill.createdAt).toLocaleString('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}` + NL;
            receipt += `CUST    : ${bill.customerName}` + NL;
            receipt += `VEHICLE : ${bill.vehicleNo}` + NL;
            receipt += `ROUTE   : ${bill.route}` + NL;
            receipt += "--------------------------------" + NL;
            receipt += formatLine('DESC', 'AMT') + NL;
            receipt += "--------------------------------" + NL;
            
            receipt += formatLine(`Mileage`, fmt((bill.endMeter - bill.startMeter) * bill.hireRate)) + NL;
            if (bill.waitingCharge > 0) receipt += formatLine("Waiting", fmt(bill.waitingCharge)) + NL;
            if (bill.gatePass > 0) receipt += formatLine("Gate Pass", fmt(bill.gatePass)) + NL;
            if (bill.packageCharge > 0) receipt += formatLine("Package Charges", fmt(bill.packageCharge)) + NL;
            
            receipt += "--------------------------------" + NL;
            receipt += BOLD_ON + formatLine("TOTAL:", fmt(bill.totalAmount)) + BOLD_OFF + NL;
            if (bill.advanceAmount > 0) receipt += formatLine("ADVANCE:", "-" + fmt(bill.advanceAmount)) + NL;
            receipt += BOLD_ON + formatLine("BALANCE:", fmt(Math.max(0, bill.totalAmount - (bill.advanceAmount || 0)))) + BOLD_OFF + NL;
            receipt += "================================" + NL + NL;
            receipt += CENTER + "Customer Signature:" + NL + NL + NL + ".................." + NL;
            receipt += "Thank You!" + NL + "Powered By VIRGIL" + NL + NL + NL + NL; // Feed 4 lines

            // Send in chunks of 512 bytes (BLE limitation)
            const data = encoder.encode(receipt);
            const chunkSize = 512;
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                if (characteristic.properties.writeWithoutResponse) {
                    await characteristic.writeValueWithoutResponse(chunk);
                } else {
                    await characteristic.writeValue(chunk);
                }
            }

            setStatusText('Done!');
            setTimeout(() => {
                setStatusText('');
                setIsPrinting(false);
            }, 2000);

        } catch (error) {
            console.error("Bluetooth Print Error:", error);
            setStatusText('Failed to print');
            alert(`Printing Failed: ${(error as Error).message}\n\nNote: If your printer is PT-210, it might only support 'Classic Bluetooth'. For Classic Bluetooth, use the standard OS 'Print' button with the 'RawBT' Android app instead.`);
            setIsPrinting(false);
            setTimeout(() => setStatusText(''), 4000);
        }
    };

    return (
        <button
            onClick={handleBluetoothPrint}
            disabled={isPrinting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold shadow-md transition-all disabled:opacity-70"
        >
            {isPrinting ? (
                <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {statusText}
                </>
            ) : (
                <>
                    <Bluetooth className="h-5 w-5" />
                    Connect Thermal Printer
                </>
            )}
        </button>
    );
}
