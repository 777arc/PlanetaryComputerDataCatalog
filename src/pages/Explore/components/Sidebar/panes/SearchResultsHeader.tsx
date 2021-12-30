import {
  FontSizes,
  FontWeights,
  IStackTokens,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
} from "@fluentui/react";

import { IStacSearchResult } from "types/stac";
import { useExploreSelector } from "pages/Explore/state/hooks";
import { loadingStyle } from "./SearchResultsPane";
import QueryInfo from "./QueryInfo";

interface SearchResultsHeaderProps {
  results: IStacSearchResult | undefined;
  isLoading: boolean;
}

const SearchResultsHeader = ({ results, isLoading }: SearchResultsHeaderProps) => {
  const collection = useExploreSelector(s => s.mosaic.collection);

  if (results === undefined) return null;

  const returned = results.features.length;
  const hasNextLink = results.links.find(l => l.rel === "next");
  const plural = returned === 1 ? "item" : "items";
  const preamble = hasNextLink ? "the first" : "";

  const style = {
    root: {
      fontSize: "12px",
      ...loadingStyle(isLoading),
    },
  };

  const withResults = (
    <Text styles={style}>
      Showing {preamble} {returned} {plural} that matched your filter.
    </Text>
  );
  const withoutResults = (
    <Text block styles={style}>
      Sorry, no items matched your filter. Try adjusting the query parameters or
      expand the map area.
    </Text>
  );
  const resultsText = returned !== 0 ? withResults : withoutResults;

  return (
    <Stack tokens={tokens} styles={styles}>
      <Stack horizontal tokens={tokens}>
        <Text styles={headerStyles}>{collection?.title}</Text>
        {isLoading && <Spinner size={SpinnerSize.xSmall} />}
      </Stack>
      <Stack
        horizontal
        tokens={tokens}
        horizontalAlign="space-between"
        verticalAlign="center"
        style={{ marginTop: 0 }}
      >
        {resultsText}
        <QueryInfo />
      </Stack>
    </Stack>
  );
};

export default SearchResultsHeader;

const tokens: IStackTokens = {
  childrenGap: 6,
};

const styles = {
  root: { padding: "14px 5px 5px 5px" },
};

const headerStyles = {
  root: { fontSize: FontSizes.medium, fontWeight: FontWeights.bold },
};
