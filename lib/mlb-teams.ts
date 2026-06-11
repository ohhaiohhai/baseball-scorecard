// The 30 MLB franchises, sorted alphabetically by city/location name.
// `id` is the standard abbreviation; `label` is what we store on a Game and
// show in the UI.

export interface MlbTeam {
  id: string;
  city: string;
  name: string;
  label: string;
}

function team(id: string, city: string, name: string): MlbTeam {
  return { id, city, name, label: `${city} ${name}` };
}

export const MLB_TEAMS: MlbTeam[] = [
  team("ATH", "Athletics", "Athletics"),
  team("ARI", "Arizona", "Diamondbacks"),
  team("ATL", "Atlanta", "Braves"),
  team("BAL", "Baltimore", "Orioles"),
  team("BOS", "Boston", "Red Sox"),
  team("CHC", "Chicago", "Cubs"),
  team("CWS", "Chicago", "White Sox"),
  team("CIN", "Cincinnati", "Reds"),
  team("CLE", "Cleveland", "Guardians"),
  team("COL", "Colorado", "Rockies"),
  team("DET", "Detroit", "Tigers"),
  team("HOU", "Houston", "Astros"),
  team("KC", "Kansas City", "Royals"),
  team("LAA", "Los Angeles", "Angels"),
  team("LAD", "Los Angeles", "Dodgers"),
  team("MIA", "Miami", "Marlins"),
  team("MIL", "Milwaukee", "Brewers"),
  team("MIN", "Minnesota", "Twins"),
  team("NYM", "New York", "Mets"),
  team("NYY", "New York", "Yankees"),
  team("PHI", "Philadelphia", "Phillies"),
  team("PIT", "Pittsburgh", "Pirates"),
  team("SD", "San Diego", "Padres"),
  team("SF", "San Francisco", "Giants"),
  team("SEA", "Seattle", "Mariners"),
  team("STL", "St. Louis", "Cardinals"),
  team("TB", "Tampa Bay", "Rays"),
  team("TEX", "Texas", "Rangers"),
  team("TOR", "Toronto", "Blue Jays"),
  team("WSH", "Washington", "Nationals"),
].sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
