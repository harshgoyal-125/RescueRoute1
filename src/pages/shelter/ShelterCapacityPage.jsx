import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FOOD_TYPES } from '../../data/donations';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';

export default function ShelterCapacityPage() {
  const { shelterCapacity, updateCapacitySettings } = useApp();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    currentCapacity: shelterCapacity?.currentCapacity ?? 0,
    maxCapacity: shelterCapacity?.maxCapacity ?? 0,
    preferredRadiusMiles: shelterCapacity?.preferredRadiusMiles ?? 8,
    acceptedCategories: [...(shelterCapacity?.acceptedCategories || [])]
  });

  useEffect(() => {
    if (shelterCapacity) setFormState({ ...shelterCapacity, acceptedCategories: [...shelterCapacity.acceptedCategories] });
  }, [shelterCapacity]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleCategoryToggle = (cat) => {
    setFormState(prev => {
      const exists = prev.acceptedCategories.includes(cat);
      return {
        ...prev,
        acceptedCategories: exists
          ? prev.acceptedCategories.filter(c => c !== cat)
          : [...prev.acceptedCategories, cat]
      };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: Number(value) || value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (formState.currentCapacity < 0) {
      newErrors.currentCapacity = 'Current capacity cannot be negative';
    }
    if (formState.maxCapacity <= 0) {
      newErrors.maxCapacity = 'Max capacity must be greater than zero';
    }
    if (formState.currentCapacity > formState.maxCapacity) {
      newErrors.currentCapacity = 'Current capacity cannot exceed maximum capacity';
    }
    if (formState.preferredRadiusMiles <= 0) {
      newErrors.preferredRadiusMiles = 'Preferred radius must be at least 1 mile';
    }
    if (formState.acceptedCategories.length === 0) {
      newErrors.categories = 'Please select at least one accepted food category';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    try {
      await updateCapacitySettings(formState);
      setSavedSuccess(true);
    } catch (err) {
      setErrors({ form: err.message || 'Unable to save capacity.' });
      return;
    }
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="shelter-capacity-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            onClick={() => navigate('/shelter')}
            className="btn btn-outline btn-sm"
            style={{ marginBottom: '0.75rem', border: 'none', paddingLeft: 0 }}
          >
            <ArrowLeft size={16} />
            <span>Back to Shelter Dashboard</span>
          </button>
          <h1 className="page-title">Capacity & Matching Preferences</h1>
          <p className="page-description">
            Configure meal limits, dietary intake rules, and geographic radius for automated routing.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
          role="status"
          data-testid="capacity-save-success"
        >
          <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
          <span>Capacity settings saved.</span>
        </div>
      )}

      {errors.form && <p role="alert">{errors.form}</p>}
      <Card>
        <form onSubmit={handleSubmit} noValidate>
          {/* Capacity Numbers */}
          <div className="form-row">
            <FormField
              id="currentCapacity"
              name="currentCapacity"
              label="Current Filled Capacity (Meals)"
              type="number"
              min="0"
              value={formState.currentCapacity}
              onChange={handleChange}
              required
              error={errors.currentCapacity}
              helpText="Number of meals currently stored or pledged today."
            />

            <FormField
              id="maxCapacity"
              name="maxCapacity"
              label="Maximum Storage Capacity (Meals)"
              type="number"
              min="1"
              value={formState.maxCapacity}
              onChange={handleChange}
              required
              error={errors.maxCapacity}
              helpText="Maximum total meal storage across refrigerators & pantry."
            />
          </div>

          {/* Logistics Radius */}
          <FormField
            id="preferredRadiusMiles"
            name="preferredRadiusMiles"
            label="Preferred Pickup / Donor Radius (Miles)"
            type="number"
            min="1"
            max="50"
            value={formState.preferredRadiusMiles}
            onChange={handleChange}
            required
            error={errors.preferredRadiusMiles}
            helpText="Matches beyond this radius will receive a lower compatibility score."
          />

          {/* Food Category Preferences */}
          <div className="form-group">
            <label className="form-label form-label-required">
              Accepted Food Categories:
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                marginTop: '0.5rem'
              }}
            >
              {FOOD_TYPES.map((cat) => {
                const checked = formState.acceptedCategories.includes(cat);
                return (
                  <label
                    key={cat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.625rem 0.75rem',
                      border: checked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: checked ? 'var(--primary-50)' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: checked ? 600 : 400,
                      color: checked ? 'var(--primary-800)' : 'var(--slate-700)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleCategoryToggle(cat)}
                      style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                    />
                    <span>{cat}</span>
                  </label>
                );
              })}
            </div>
            {errors.categories && (
              <div className="form-error" role="alert">{errors.categories}</div>
            )}
          </div>

          {/* Submit */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '1rem',
              borderTop: '1px solid var(--slate-100)',
              paddingTop: '1.25rem',
              marginTop: '1.5rem'
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/shelter')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              data-testid="save-capacity-btn"
            >
              Save Capacity Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
