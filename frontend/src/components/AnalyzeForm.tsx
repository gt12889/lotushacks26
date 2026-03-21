'use client';

import { useState, useRef } from 'react';

interface AnalyzeFormProps {
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
}

export default function AnalyzeForm({ onSubmit, isLoading }: AnalyzeFormProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('plate_number', plateNumber);
    formData.append('vehicle_type', vehicleType);
    if (fileInputRef.current?.files?.[0]) {
      formData.append('image', fileInputRef.current.files[0]);
    }
    if (location) formData.append('location', location);
    if (time) formData.append('time', time);
    if (description) formData.append('description', description);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analyze Incident</h2>

      {/* Plate Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          License Plate Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
          placeholder="e.g. 51F12345"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono text-gray-900"
          required
        />
        <p className="text-xs text-gray-500 mt-1">No dashes or spaces</p>
      </div>

      {/* Vehicle Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vehicle Type <span className="text-red-500">*</span>
        </label>
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        >
          <option value="motorbike">Motorbike (Xe m&#225;y)</option>
          <option value="car">Car (&#212; t&#244; con)</option>
          <option value="truck">Truck (Xe t&#7843;i)</option>
        </select>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Incident Photo <span className="text-red-500">*</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
          ) : (
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Click to upload incident photo</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          required
        />
      </div>

      {/* Optional Fields */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
          + Additional Details (optional)
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Ng&#227; t&#432; L&#234; L&#7907;i - Nguy&#7877;n Hu&#7879;, TP.HCM"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time of Incident</label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 2024-10-15 14:30"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
          </div>
        </div>
      </details>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !plateNumber || !imagePreview}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
      >
        {isLoading ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  );
}
