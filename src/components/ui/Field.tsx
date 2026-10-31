import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldProps {
	label: React.ReactNode;
	error?: string;
	hint?: React.ReactNode;
	className?: string;
	children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
}

/** Label, control, hint and error wired together for screen readers. */
export function Field({ label, error, hint, className, children }: FieldProps) {
	const id = useId();
	const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<label htmlFor={id} className="text-sm font-semibold text-[#26362D]">
				{label}
			</label>
			{children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
			{error ? (
				<p id={`${id}-error`} role="alert" className="text-[13px] font-medium text-danger">
					{error}
				</p>
			) : hint ? (
				<p id={`${id}-hint`} className="text-[13px] text-subtle">
					{hint}
				</p>
			) : null}
		</div>
	);
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
	<input ref={ref} className={cn("field", className)} {...props} />
));
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
	<span className="relative block">
		<select ref={ref} className={cn("field appearance-none pr-10", className)} {...props}>
			{children}
		</select>
		<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-subtle" aria-hidden />
	</span>
));
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
	<textarea ref={ref} className={cn("field h-24 resize-y py-3", className)} {...props} />
));
Textarea.displayName = "Textarea";
