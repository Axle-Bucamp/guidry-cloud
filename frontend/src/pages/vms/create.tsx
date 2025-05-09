import React, {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/router';
import {
  Controller,
  useForm,
} from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';

// Define Zod schema for form validation
const vmCreationSchema = z.object({
  name: z.string().min(1, 'VM name is required'),
  templateId: z.string().min(1, 'Template selection is required'),
  cpu: z.number().min(1).optional(),
  memory: z.number().min(512).optional(), // MB
  disk: z.string().optional(), // e.g., "local-lvm:32"
  // Add other fields as needed
});

type VmCreationFormValues = z.infer<typeof vmCreationSchema>;

// Mock data for templates (replace with actual data source)
const mockTemplates = [
  { id: 'ubuntu-lts', name: 'Ubuntu LTS Server', description: 'A standard Ubuntu LTS server.', cpu: 2, memory: 2048, disk: 'local-lvm:32' },
  { id: 'centos-stream', name: 'CentOS Stream Server', description: 'A standard CentOS Stream server.', cpu: 1, memory: 1024, disk: 'local-lvm:20' },
  { id: 'windows-server', name: 'Windows Server 2022', description: 'A Windows Server 2022 instance.', cpu: 2, memory: 4096, disk: 'local-lvm:50' },
  { id: 'custom', name: 'Custom Configuration', description: 'Configure your own VM specifications.' },
];

const CreateVmPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VmCreationFormValues>({
    resolver: zodResolver(vmCreationSchema),
    defaultValues: {
      name: '',
      templateId: '',
      cpu: 1,
      memory: 1024,
      disk: 'local-lvm:20',
    },
  });

  const selectedTemplateId = watch('templateId');

  // Update form fields when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = mockTemplates.find(t => t.id === selectedTemplateId);
      if (template) {
        setValue('cpu', template.cpu);
        setValue('memory', template.memory);
        setValue('disk', template.disk);
      }
    }
  }, [selectedTemplateId, setValue]);

  const onSubmit = async (data: VmCreationFormValues) => {
    setIsLoading(true);
    setFormError(null);
    try {
      // Replace with actual API call to create VM
      // For now, simulating API call and showing success/error messages
      console.log('Submitting VM creation request:', data);
      // await createVm(data); // Uncomment when API is ready
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      toast.success(`VM ${data.name} creation request submitted successfully!`);
      router.push('/vms'); // Redirect to VM list or details page
    } catch (error: any) {
      console.error('Error creating VM:', error);
      setFormError(error.message || 'Failed to create VM. Please try again.');
      toast.error(error.message || 'Failed to create VM. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create New Virtual Machine</h1>
      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{formError}</span>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="templateId" className="block text-sm font-medium text-gray-700">Template</label>
          <Controller
            name="templateId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {mockTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.templateId && <p className="mt-2 text-sm text-red-600">{errors.templateId.message}</p>}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">VM Name</label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        {/* Conditionally render fields based on selected template or allow overrides */}
        {selectedTemplateId && (
          <>
            <div>
              <label htmlFor="cpu" className="block text-sm font-medium text-gray-700">CPU Cores</label>
              <Input id="cpu" type="number" {...register('cpu', { valueAsNumber: true })} />
              {errors.cpu && <p className="mt-2 text-sm text-red-600">{errors.cpu.message}</p>}
            </div>
            <div>
              <label htmlFor="memory" className="block text-sm font-medium text-gray-700">Memory (MB)</label>
              <Input id="memory" type="number" {...register('memory', { valueAsNumber: true })} />
              {errors.memory && <p className="mt-2 text-sm text-red-600">{errors.memory.message}</p>}
            </div>
            <div>
              <label htmlFor="disk" className="block text-sm font-medium text-gray-700">Disk (e.g., local-lvm:32 for 32GB on local-lvm)</label>
              <Input id="disk" {...register('disk')} />
              {errors.disk && <p className="mt-2 text-sm text-red-600">{errors.disk.message}</p>}
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create VM'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateVmPage;

