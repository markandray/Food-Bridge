import { useState, useRef } from 'react';
import { Upload, X, Image, MapPin } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { validateListingForm, isFormValid } from '../../utils/validators';
import { CITIES, FOOD_UNITS, FOOD_TAGS, LISTING_LIMITS } from '../../utils/constants';
import { toDatetimeLocalString } from '../../utils/dateHelpers';
import Button from '../common/Button';
import Input from '../common/Input';

// pickupAddress added — empty string is the correct default (not null)
// so the controlled input never goes uncontrolled
const EMPTY_FORM = {
  foodName: '', quantity: '', unit: '', description: '',
  expiryTime: '', pickupWindowStart: '', pickupWindowEnd: '',
  city: '', pickupAddress: '',
  tags: [],
};

const ListingForm = ({
  initialValues = null,
  onSubmit,
  onCancel,
  submitLabel = 'Post Listing',
  defaultCity = '',
}) => {
  const [formData, setFormData] = useState(
    initialValues
      ? {
          ...EMPTY_FORM, ...initialValues,
          expiryTime:        toDatetimeLocalString(initialValues?.expiryTime),
          pickupWindowStart: toDatetimeLocalString(initialValues?.pickupWindowStart),
          pickupWindowEnd:   toDatetimeLocalString(initialValues?.pickupWindowEnd),
          // pickupAddress spreads in from initialValues via ...initialValues above.
          // No special conversion needed — it's already a plain string.
        }
      : { ...EMPTY_FORM, city: defaultCity }
  );

  const [errors, setErrors]                 = useState({});
  const [photoFile, setPhotoFile]           = useState(null);
  const [photoPreview, setPhotoPreview]     = useState(initialValues?.photoURL || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (submitError)  setSubmitError('');
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Please select an image file' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'Image must be under 5MB' }));
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, photo: '' }));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadPhoto = async (file, listingId) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `listings/${listingId}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        'state_changed',
        (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
        (error) => {
          console.error('Firebase photo upload error:', error);
          reject(error);
        },
        async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateListingForm(formData);
    if (!isFormValid(validationErrors)) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(formData, null, null );
      setFormData({ ...EMPTY_FORM, city: defaultCity });
      setPhotoFile(null);
      setPhotoPreview(null);
      setUploadProgress(0);
    } catch (error) {
      setSubmitError(error.message || 'Failed to submit listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectBase = `w-full px-3 py-2.5 rounded-lg border text-sm transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none cursor-pointer
    bg-white dark:bg-slate-700
    text-slate-900 dark:text-slate-100`;

  const selectBorder = (hasError) => hasError
    ? 'border-red-400 focus:ring-red-500'
    : 'border-slate-300 dark:border-slate-600 focus:border-emerald-500 focus:ring-emerald-500';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          {submitError}
        </div>
      )}

      {/* Food Details — unchanged */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Food Details</h3>

        <Input
          label="Food Name" name="foodName" value={formData.foodName} onChange={handleChange}
          placeholder="e.g. Dal Makhani, Vegetable Biryani" error={errors.foodName} required
          hint={`${formData.foodName.length}/${LISTING_LIMITS.FOOD_NAME_MAX} characters`}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange}
            placeholder="e.g. 10" error={errors.quantity} required
            min={LISTING_LIMITS.QUANTITY_MIN} max={LISTING_LIMITS.QUANTITY_MAX} step="0.1"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="unit" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Unit <span className="text-red-500">*</span>
            </label>
            <select id="unit" name="unit" value={formData.unit} onChange={handleChange}
              className={`${selectBase} ${selectBorder(errors.unit)}`}>
              <option value="">Select unit</option>
              {FOOD_UNITS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.unit && <p className="text-xs text-red-600 dark:text-red-400">⚠ {errors.unit}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Description <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
          </label>
          <textarea
            id="description" name="description" value={formData.description} onChange={handleChange}
            rows={3} maxLength={LISTING_LIMITS.DESCRIPTION_MAX}
            placeholder="Any details about the food — allergens, cuisine type, packaging..."
            className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-offset-0
              bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              ${errors.description
                ? 'border-red-400 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
          />
          <div className="flex justify-between">
            {errors.description && <p className="text-xs text-red-600 dark:text-red-400">⚠ {errors.description}</p>}
            <p className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
              {formData.description.length}/{LISTING_LIMITS.DESCRIPTION_MAX}
            </p>
          </div>
        </div>
      </div>

      {/* Feature L: Food Category Tags */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Category Tags</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Optional — select all that apply
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FOOD_TAGS.map(({ value, label }) => {
            const isSelected = formData.tags.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    tags: isSelected
                      ? prev.tags.filter((t) => t !== value)
                      : [...prev.tags, value],
                  }));
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {formData.tags.length > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {formData.tags.length} tag{formData.tags.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Time & Location — pickupAddress added at the bottom of this section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Time & Location</h3>

        <Input
          label="Expiry Time" name="expiryTime" type="datetime-local"
          value={formData.expiryTime} onChange={handleChange} error={errors.expiryTime} required
          hint="When will this food expire? NGOs must collect before this time."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Pickup Window Start" name="pickupWindowStart" type="datetime-local"
            value={formData.pickupWindowStart} onChange={handleChange} error={errors.pickupWindowStart} required
          />
          <Input
            label="Pickup Window End" name="pickupWindowEnd" type="datetime-local"
            value={formData.pickupWindowEnd} onChange={handleChange} error={errors.pickupWindowEnd} required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="city" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            City <span className="text-red-500">*</span>
          </label>
          <select id="city" name="city" value={formData.city} onChange={handleChange}
            className={`${selectBase} ${selectBorder(errors.city)}`}>
            <option value="">Select city</option>
            {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          {errors.city && <p className="text-xs text-red-600 dark:text-red-400">⚠ {errors.city}</p>}
        </div>

        {/* NEW — Feature H: Pickup address
            Placed directly below city because they're logically related (both location).
            Uses the MapPin icon to visually connect it to the city row above.
            Shown to restaurants only — NGOs see it on the card after claiming.
            char counter matches Description pattern for consistency. */}
        <div className="flex flex-col gap-1">
          <Input
            label="Pickup Address"
            name="pickupAddress"
            value={formData.pickupAddress}
            onChange={handleChange}
            placeholder="e.g. 12, MG Road, Ground Floor, Near Metro Gate 2"
            error={errors.pickupAddress}
            icon={MapPin}
            required
            hint={`Full street address where NGO should collect · ${formData.pickupAddress.length}/${LISTING_LIMITS.ADDRESS_MAX} chars`}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
    Photo <span className="text-slate-400 dark:text-slate-500 font-normal text-sm">(temporarily unavailable)</span>
  </h3>

  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
    <p className="text-sm text-amber-700 dark:text-amber-300">
      Photo uploads are temporarily unavailable.
    </p>
  </div>
</div>

      {/* Photo Upload — unchanged
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Photo <span className="text-slate-400 dark:text-slate-500 font-normal text-sm">(optional)</span>
        </h3>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" aria-label="Upload food photo" />
        {photoPreview ? (
          <div className="relative rounded-xl overflow-hidden">
            <img src={photoPreview} alt="Food preview" className="w-full h-48 object-cover" />
            <button type="button" onClick={removePhoto}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors">
              <X className="h-4 w-4" />
            </button>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs py-1.5 text-center">
                Uploading {uploadProgress}%...
              </div>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="w-full h-36 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer">
            <Image className="h-8 w-8" />
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload photo</p>
              <p className="text-xs">PNG, JPG up to 5MB</p>
            </div>
          </button>
        )}
        {errors.photo && <p className="text-xs text-red-600 dark:text-red-400 mt-2">⚠ {errors.photo}</p>}
      </div> */}

      {/* Form actions — unchanged */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
        )}
        <Button type="submit" variant="primary" fullWidth loading={submitting} icon={Upload}>
          {submitting ? 'Posting...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default ListingForm;