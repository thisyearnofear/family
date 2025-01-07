import { useToast } from "./use-toast";
import { AnimatePresence, motion } from "framer-motion";

export function Toast() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`p-4 rounded-lg shadow-lg ${
              toast.variant === "destructive"
                ? "bg-red-500 text-white"
                : "bg-white text-gray-900"
            }`}
          >
            <h3 className="font-semibold">{toast.title}</h3>
            {toast.description && (
              <p className="mt-1 text-sm opacity-90">{toast.description}</p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 