import React from 'react';
import { Input, InputProps } from './Input';

export interface SuggestInputProps extends InputProps {
  /** Array of strings to show as suggestions */
  suggestions: string[];
  /** Unique ID for the datalist element */
  listId: string;
}

/**
 * A generic Input component that provides autocomplete suggestions.
 * Uses the native HTML5 datalist element for lightweight, accessible suggestions.
 */
export const SuggestInput = React.forwardRef<HTMLInputElement, SuggestInputProps>(
  ({ suggestions, listId, ...props }, ref) => {
    // Filter out duplicates and empty values to keep the list clean
    const uniqueSuggestions = Array.from(new Set(suggestions.filter(Boolean)));

    return (
      <div className="w-full relative">
        <Input 
          {...props} 
          ref={ref} 
          list={listId} 
          autoComplete="off" 
        />
        <datalist id={listId}>
          {uniqueSuggestions.map((suggestion, index) => (
            <option key={`${listId}-${index}`} value={suggestion} />
          ))}
        </datalist>
      </div>
    );
  }
);

SuggestInput.displayName = 'SuggestInput';
