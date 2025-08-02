interface RecipeFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterRating: string;
  setFilterRating: (rating: string) => void;
  filterTime: string;
  setFilterTime: (time: string) => void;
}

export function RecipeFilters({
  searchTerm,
  setSearchTerm,
  filterRating,
  setFilterRating,
  filterTime,
  setFilterTime,
}: RecipeFiltersProps) {
  return (
    <div className="filter-section">
      <h3>Find Your Perfect Recipe</h3>
      <div className="flex gap-6 flex-wrap items-end">
        <div className="recipe-form-group flex-1 min-w-[250px] mb-0">
          <label htmlFor="search">Search Recipes</label>
          <input
            type="text"
            id="search"
            className="recipe-input"
            placeholder="Search by name or ingredient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="recipe-form-group flex-none w-[180px] mb-0">
          <label htmlFor="filter-rating">Minimum Rating</label>
          <select
            id="filter-rating"
            className="recipe-select"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <option value="">Any Rating</option>
            <option value="5">5 Stars</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
          </select>
        </div>
        <div className="recipe-form-group flex-none w-[180px] mb-0">
          <label htmlFor="filter-time">Cook Time</label>
          <select
            id="filter-time"
            className="recipe-select"
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
          >
            <option value="">Any Time</option>
            <option value="15">Under 15 min</option>
            <option value="30">Under 30 min</option>
            <option value="60">Under 1 hour</option>
          </select>
        </div>
      </div>
    </div>
  );
}
