interface TitleInputProps {
  title: string;
  onTitleChange: (title: string) => void;
}

export function TitleInput({ title, onTitleChange }: TitleInputProps) {
  return (
    <div className="space-y-4 text-center">
      <h3 className="text-lg font-semibold">Customize Title</h3>
      <p className="text-sm text-gray-600 mb-6">
        This will be shown in the final gallery view
      </p>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Enter a title for your gift"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
