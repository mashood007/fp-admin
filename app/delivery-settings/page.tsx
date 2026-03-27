"use client";

import { FormEvent, useEffect, useState } from "react";

type DeliverySettingsResponse = {
  id: string | null;
  deliveryCharge: number;
  minimumPurchaseForFreeDelivery: number;
  isActive: boolean;
};

export default function DeliverySettingsPage() {
  const [deliveryCharge, setDeliveryCharge] = useState<string>("");
  const [minimumPurchase, setMinimumPurchase] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/delivery-settings");
      if (!response.ok) {
        throw new Error("Failed to fetch delivery settings");
      }
      const data: DeliverySettingsResponse = await response.json();
      setDeliveryCharge(data.deliveryCharge.toString());
      setMinimumPurchase(data.minimumPurchaseForFreeDelivery.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/delivery-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryCharge: Number(deliveryCharge),
          minimumPurchaseForFreeDelivery: Number(minimumPurchase),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save delivery settings");
      }

      setMessage("Delivery settings saved successfully.");
      setDeliveryCharge(data.settings.deliveryCharge.toString());
      setMinimumPurchase(data.settings.minimumPurchaseForFreeDelivery.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900">Delivery Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configure delivery charge and the minimum purchase amount for free delivery.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-lg bg-white p-6 shadow">
          <div>
            <label
              htmlFor="deliveryCharge"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Delivery Charge (AED)
            </label>
            <input
              id="deliveryCharge"
              type="number"
              min="0"
              step="0.01"
              required
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="minimumPurchase"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Minimum Purchase For Free Delivery (AED)
            </label>
            <input
              id="minimumPurchase"
              type="number"
              min="0"
              step="0.01"
              required
              value={minimumPurchase}
              onChange={(e) => setMinimumPurchase(e.target.value)}
              className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
