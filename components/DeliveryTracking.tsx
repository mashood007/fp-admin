"use client";

import { useState } from "react";
import { getTrackingAction } from "@/app/actions/delivery";

export default function DeliveryTracking({ awb }: { awb: string }) {
    const [trackingData, setTrackingData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasFetched, setHasFetched] = useState(false);

    const handleTrackOrder = async () => {
        setIsLoading(true);
        setError("");

        try {
            const result = await getTrackingAction(awb);
            if (result.success) {
                setTrackingData(result.data);
            } else {
                setError(result.error || "Failed to fetch tracking information");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
            setHasFetched(true);
        }
    };

    if (!hasFetched) {
        return (
            <div className="mt-2">
                <button
                    onClick={handleTrackOrder}
                    disabled={isLoading}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Tracking..." : "Track Order"}
                </button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-2">
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <button
                    onClick={handleTrackOrder}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!trackingData || !trackingData.AirwayBillTrackList || trackingData.AirwayBillTrackList.length === 0) {
        return <p className="text-sm text-gray-500">Tracking information not available yet.</p>;
    }

    const trackInfo = trackingData.AirwayBillTrackList[0];
    const logs = trackInfo.TrackingLogDetails || [];

    return (
        <div>
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Current Status</span>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {logs.length > 0 ? logs[0].Remarks : "Generated"}
                    </span>
                </div>
                {/* <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <span>Origin: {trackInfo.Origin}</span>
                    <span>Destination: {trackInfo.Destination}</span>
                </div> */}
            </div>

            <div className="flow-root">
                <ul role="list" className="-mb-8">
                    {logs.map((log: any, logIdx: number) => (
                        <li key={logIdx}>
                            <div className="relative pb-8">
                                {logIdx !== logs.length - 1 ? (
                                    <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${log.Status === "DELIVERED" || log.Status === "POD" ? "bg-green-500" : "bg-gray-400"
                                            }`}>
                                            <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                        <div>
                                            <p className="text-sm text-gray-500">
                                                {log.Remarks} <span className="font-medium text-gray-900">({log.Status})</span>
                                            </p>
                                            {log.Location && <p className="text-xs text-gray-400">{log.Location}</p>}
                                        </div>
                                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                            <time dateTime={`${log.ActivityDate} ${log.ActivityTime}`}>
                                                {log.ActivityDate} {log.ActivityTime}
                                            </time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
