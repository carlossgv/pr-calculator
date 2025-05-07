import { useTheme } from 'react-native-paper';
import { Text, TextProps } from './Themed';

export function MonoText(props: TextProps) {
  const theme = useTheme();

  return <Text {...props} style={[props.style, { fontFamily: 'SpaceMono', color: theme.colors.onBackground }]} />;
}
