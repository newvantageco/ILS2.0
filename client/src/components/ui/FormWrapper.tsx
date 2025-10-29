import * as React from "react";
import { useForm, UseFormReturn, FieldValues, DefaultValues, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner, ButtonLoadingSpinner } from "@/components/ui/LoadingSpinner";

interface FormWrapperProps<T extends FieldValues> {
  schema: z.ZodType<T>;
  defaultValues: DefaultValues<T>;
  onSubmit: SubmitHandler<T>;
  children: (form: UseFormReturn<T>) => React.ReactNode;
  className?: string;
  submitLabel?: string;
  isLoading?: boolean;
}

export function FormWrapper<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className = "",
  submitLabel = "Submit",
  isLoading = false,
}: FormWrapperProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        {children(form)}
        <Button type="submit" disabled={form.formState.isSubmitting || isLoading} className="mt-6">
          {(form.formState.isSubmitting || isLoading) && (
            <ButtonLoadingSpinner className="mr-2" />
          )}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}

// Field components with consistent styling and error handling
interface FormInputFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  type?: string;
  disabled?: boolean;
  form: UseFormReturn<any>;
}

export function FormInputField({
  name,
  label,
  placeholder,
  description,
  type = "text",
  disabled = false,
  form,
}: FormInputFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface FormTextareaFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  rows?: number;
  disabled?: boolean;
  form: UseFormReturn<any>;
}

export function FormTextareaField({
  name,
  label,
  placeholder,
  description,
  rows = 4,
  disabled = false,
  form,
}: FormTextareaFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface FormSelectFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  form: UseFormReturn<any>;
}

export function FormSelectField({
  name,
  label,
  placeholder = "Select an option",
  description,
  options,
  disabled = false,
  form,
}: FormSelectFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
