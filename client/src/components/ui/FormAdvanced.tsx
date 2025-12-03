/**
 * Advanced Form System
 *
 * Features:
 * - React Hook Form integration
 * - Zod schema validation
 * - Multi-step wizards with progress
 * - Auto-save drafts
 * - Field-level validation
 * - Conditional fields
 * - Dynamic field arrays
 * - File uploads with preview
 * - Rich text editing
 * - Accessibility (ARIA labels, error announcements)
 */

import * as React from "react";
import { useForm, FormProvider, useFormContext, Controller, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  X,
  Plus,
  Trash2,
  Upload,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fadeVariants } from "@/lib/animations";

// ============================================================================
// TYPES
// ============================================================================

export interface FormStep {
  title: string;
  description?: string;
  fields: string[];
  validate?: () => Promise<boolean>;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "password" | "textarea" | "select" | "checkbox" | "radio" | "switch" | "file" | "date" | "time";
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  accept?: string; // for file inputs
  multiple?: boolean; // for file/select inputs
  rows?: number; // for textarea
  min?: number;
  max?: number;
  step?: number;
  pattern?: RegExp;
  disabled?: boolean;
  hidden?: boolean;
  conditional?: (values: any) => boolean;
}

export interface FormAdvancedProps<T extends z.ZodType<any, any>> {
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void> | void;
  defaultValues?: Partial<z.infer<T>>;
  fields?: FormFieldConfig[];
  steps?: FormStep[];
  enableAutoSave?: boolean;
  autoSaveKey?: string;
  className?: string;
  children?: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
}

// ============================================================================
// FORM PROVIDER
// ============================================================================

export function FormAdvanced<T extends z.ZodType<any, any>>({
  schema,
  onSubmit,
  defaultValues,
  fields = [],
  steps,
  enableAutoSave = false,
  autoSaveKey,
  className,
  children,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onCancel,
  isLoading = false,
}: FormAdvancedProps<T>) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: "onChange",
  });

  // Auto-save functionality
  const formValues = form.watch();
  React.useEffect(() => {
    if (enableAutoSave && autoSaveKey) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(autoSaveKey, JSON.stringify(formValues));
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formValues, enableAutoSave, autoSaveKey]);

  // Load saved draft
  React.useEffect(() => {
    if (enableAutoSave && autoSaveKey) {
      const saved = localStorage.getItem(autoSaveKey);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          form.reset(data);
        } catch (e) {
          console.error("Failed to load saved form data", e);
        }
      }
    }
  }, []);

  const handleSubmit = async (data: z.infer<T>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      // Clear auto-saved data on successful submit
      if (enableAutoSave && autoSaveKey) {
        localStorage.removeItem(autoSaveKey);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = async () => {
    if (!steps) return;

    const currentStepConfig = steps[currentStep];
    const fieldsToValidate = currentStepConfig.fields;

    // Validate current step fields
    const isValid = await form.trigger(fieldsToValidate as any);

    if (isValid) {
      if (currentStepConfig.validate) {
        const customValid = await currentStepConfig.validate();
        if (!customValid) return;
      }
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const isLastStep = steps ? currentStep === steps.length - 1 : true;
  const progress = steps ? ((currentStep + 1) / steps.length) * 100 : 100;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-6", className)}
      >
        {/* Multi-step Progress */}
        {steps && (
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2",
                    index === currentStep && "text-primary font-semibold",
                    index < currentStep && "text-primary",
                    index > currentStep && "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2",
                      index === currentStep && "border-primary bg-primary text-primary-foreground",
                      index < currentStep && "border-primary bg-primary text-primary-foreground",
                      index > currentStep && "border-muted-foreground"
                    )}
                  >
                    {index < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm">{index + 1}</span>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">{step.title}</div>
                    {step.description && (
                      <div className="text-xs text-muted-foreground">{step.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            {children || (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields
                  .filter((field) => {
                    if (!steps) return true;
                    return steps[currentStep].fields.includes(field.name);
                  })
                  .filter((field) => !field.hidden)
                  .filter((field) => !field.conditional || field.conditional(formValues))
                  .map((field) => (
                    <FormField key={field.name} config={field} />
                  ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {steps && currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {enableAutoSave && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Save className="h-3 w-3" />
                Auto-saving...
              </span>
            )}

            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {cancelLabel}
              </Button>
            )}

            {isLastStep ? (
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
              >
                {(isSubmitting || isLoading) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {submitLabel}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNextStep}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Form Error Summary */}
        {Object.keys(form.formState.errors).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-destructive">
                  Please fix the following errors:
                </h4>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {Object.entries(form.formState.errors).map(([field, error]) => (
                    <li key={field}>
                      {field}: {error.message as string}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </form>
    </FormProvider>
  );
}

// ============================================================================
// FORM FIELD COMPONENT
// ============================================================================

export function FormField({ config }: { config: FormFieldConfig }) {
  const form = useFormContext();
  const error = form.formState.errors[config.name];
  const value = form.watch(config.name);

  const fieldId = `field-${config.name}`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;

  return (
    <div className={cn("space-y-2", config.type === "checkbox" && "flex items-start gap-2")}>
      {config.type !== "checkbox" && (
        <Label htmlFor={fieldId} className="flex items-center gap-2">
          {config.label}
          {config.required && <span className="text-destructive">*</span>}
        </Label>
      )}

      {/* Text Input */}
      {["text", "email", "number", "password", "date", "time"].includes(config.type) && (
        <Controller
          name={config.name}
          control={form.control}
          render={({ field }) => (
            <Input
              {...field}
              id={fieldId}
              type={config.type}
              placeholder={config.placeholder}
              disabled={config.disabled}
              min={config.min}
              max={config.max}
              step={config.step}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : config.description ? descriptionId : undefined}
              className={cn(error && "border-destructive")}
            />
          )}
        />
      )}

      {/* Textarea */}
      {config.type === "textarea" && (
        <Controller
          name={config.name}
          control={form.control}
          render={({ field }) => (
            <Textarea
              {...field}
              id={fieldId}
              placeholder={config.placeholder}
              disabled={config.disabled}
              rows={config.rows || 4}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : config.description ? descriptionId : undefined}
              className={cn(error && "border-destructive")}
            />
          )}
        />
      )}

      {/* Select */}
      {config.type === "select" && (
        <Controller
          name={config.name}
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={config.disabled}
            >
              <SelectTrigger
                id={fieldId}
                className={cn(error && "border-destructive")}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : config.description ? descriptionId : undefined}
              >
                <SelectValue placeholder={config.placeholder || "Select..."} />
              </SelectTrigger>
              <SelectContent>
                {config.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}

      {/* Checkbox */}
      {config.type === "checkbox" && (
        <Controller
          name={config.name}
          control={form.control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={fieldId}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={config.disabled}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : config.description ? descriptionId : undefined}
              />
              <Label htmlFor={fieldId} className="font-normal cursor-pointer">
                {config.label}
                {config.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
          )}
        />
      )}

      {/* Radio Group */}
      {config.type === "radio" && (
        <Controller
          name={config.name}
          control={form.control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              disabled={config.disabled}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : config.description ? descriptionId : undefined}
            >
              {config.options?.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem value={option.value} id={`${fieldId}-${option.value}`} />
                  <Label htmlFor={`${fieldId}-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      )}

      {/* Switch */}
      {config.type === "switch" && (
        <Controller
          name={config.name}
          control={form.control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Switch
                id={fieldId}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={config.disabled}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : config.description ? descriptionId : undefined}
              />
              <Label htmlFor={fieldId} className="font-normal cursor-pointer">
                {config.label}
                {config.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
          )}
        />
      )}

      {/* File Upload */}
      {config.type === "file" && (
        <Controller
          name={config.name}
          control={form.control}
          render={({ field: { onChange, value, ...field } }) => (
            <div className="space-y-2">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer",
                  error && "border-destructive"
                )}
              >
                <Input
                  {...field}
                  id={fieldId}
                  type="file"
                  accept={config.accept}
                  multiple={config.multiple}
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    onChange(config.multiple ? files : files?.[0]);
                  }}
                  aria-invalid={!!error}
                  aria-describedby={error ? errorId : config.description ? descriptionId : undefined}
                />
                <Label htmlFor={fieldId} className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="text-primary font-medium">Click to upload</span>
                    {" or drag and drop"}
                  </div>
                  {config.accept && (
                    <div className="text-xs text-muted-foreground">
                      {config.accept}
                    </div>
                  )}
                </Label>
              </div>

              {/* File Preview */}
              {value && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm flex-1">
                    {typeof value === "string" ? value : value.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        />
      )}

      {/* Description */}
      {config.description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {config.description}
        </p>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            id={errorId}
            className="text-sm text-destructive flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" />
            {error.message as string}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// FORM FIELD ARRAY (for dynamic lists)
// ============================================================================

export function FormFieldArray({
  name,
  label,
  renderField,
  addButtonLabel = "Add Item",
}: {
  name: string;
  label: string;
  renderField: (index: number) => React.ReactNode;
  addButtonLabel?: string;
}) {
  const form = useFormContext();
  const [items, setItems] = React.useState<number[]>([0]);

  const handleAdd = () => {
    setItems([...items, items.length]);
  };

  const handleRemove = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2"
          >
            <div className="flex-1">{renderField(index)}</div>
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                className="mt-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        {addButtonLabel}
      </Button>
    </div>
  );
}
