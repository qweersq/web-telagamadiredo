import React from 'react';
import FilterSection from './FilterSection';
import SearchBar from './SearchBar';

const FilterAndSearch = ({
  treatment,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <div className="mx-auto px-4 py-4 pr-4 pl-4 md:px-10 flex flex-col gap-4 w-full md:max-w-none bg-white shadow-lg">
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </div>
  );
};

export default FilterAndSearch; 