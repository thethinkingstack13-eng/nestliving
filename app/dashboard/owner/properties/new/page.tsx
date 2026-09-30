'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ImageUploader from '@/components/ImageUploader';

const AMENITY_CHOICES = ['WiFi', 'AC', 'Laundry', 'Food Service', 'Gym', 'Power Backup'];

export default function NewPropertyPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const availabilityDate = String(form.get('availabilityDate'));
    const payload = {
      title: String(form.get('title')),
      description: String(form.get('description')),
      address: String(form.get('address')),
      city: String(form.get('city')),
      state: String(form.get('state')),
      roomType: String(form.get('roomType')),
      totalBeds: Number(form.get('totalBeds')),
      rentPerMonth: Number(form.get('rentPerMonth')),
      depositAmount: Number(form.get('depositAmount')),
      availabilityDate: availabilityDate ? new Date(`${availabilityDate}T12:00:00.000Z`).toISOString() : '',
      genderPreference: String(form.get('genderPreference')),
      amenities,
      imageUrls: images,
    };

    try {
      const response = await fetch('/api/owner/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? 'Could not save this listing.');
      router.push('/dashboard/owner');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save this listing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-10 lg:px-10">
        <h1 className="font-display text-3xl font-bold">Create a room listing</h1>
        <p className="mt-2 text-sm text-neutral-600">New listings are reviewed before appearing in room search.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 border border-black bg-white p-6 sm:p-8">
          <section>
            <h2 className="font-display text-lg font-bold">Property photos</h2>
            <p className="mb-3 mt-1 text-sm text-neutral-600">Add clear photos of the property and available room.</p>
            <ImageUploader purpose="property" imageUrls={images} onChange={setImages} maxImages={8} />
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide sm:col-span-2">
              Listing title
              <input name="title" required minLength={3} maxLength={100} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" placeholder="Bright private room near transit" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide sm:col-span-2">
              Description
              <textarea name="description" maxLength={2000} rows={3} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" placeholder="Describe the home, house rules, and nearby services." />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide sm:col-span-2">
              Street address
              <input name="address" required minLength={5} maxLength={200} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide">
              City
              <input name="city" required minLength={2} maxLength={100} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide">
              State
              <input name="state" required minLength={2} maxLength={100} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide">
              Room type
              <select name="roomType" className="mt-1.5 w-full border border-black bg-white px-3 py-3 text-sm font-normal normal-case">
                <option value="PRIVATE">Private</option>
                <option value="SHARED">Shared</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide">
              Guest preference
              <select name="genderPreference" className="mt-1.5 w-full border border-black bg-white px-3 py-3 text-sm font-normal normal-case">
                <option value="ANY">Any</option>
                <option value="FEMALE">Women</option>
                <option value="MALE">Men</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide">
              Total beds
              <input name="totalBeds" type="number" required min={1} max={50} defaultValue={1} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide">
              Rent per month
              <input name="rentPerMonth" type="number" required min={1} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide">
              Deposit
              <input name="depositAmount" type="number" required min={0} defaultValue={0} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide">
              Available from
              <input name="availabilityDate" type="date" required min={new Date().toISOString().slice(0, 10)} defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" />
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide">Amenities</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AMENITY_CHOICES.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 border border-black px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={amenities.includes(amenity)}
                    onChange={() => setAmenities((current) => current.includes(amenity)
                      ? current.filter((item) => item !== amenity)
                      : [...current, amenity])}
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p role="alert" className="text-sm font-medium text-[#E11D48]">{error}</p>}
          <button type="submit" disabled={saving || images.length === 0} className="w-full bg-black px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? 'SAVING LISTING…' : 'SUBMIT FOR REVIEW'}
          </button>
        </form>
      </div>
    </main>
  );
}