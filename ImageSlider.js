// @flow

import React, { useState, useEffect, useRef, type Node } from 'react';
import {
  Image,
  View,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const reactNativePackage = require('react-native/package.json');
const splitVersion = reactNativePackage.version.split('.');
const majorVersion = +splitVersion[0];
const minorVersion = +splitVersion[1];

type Slide = {
  index: number,
  style?: any,
  width?: number,
  item?: any,
};

type PropsType = {
  images: string[],
  style?: any,
  loop?: boolean,
  loopBothSides?: boolean,
  autoPlayWithInterval?: number,
  position?: number,
  onPositionChanged?: (number) => void,
  onPress?: (Object) => void,
  customButtons?: (number, (number, animated?: boolean) => void) => Node,
  customSlide?: (Slide) => Node,
};

const ImageSlider = (props: PropsType) => {
  const [position, setPosition] = useState(0);
  const [width, setWidth] = useState(Dimensions.get('window').width);
  const [intervalId, setIntervalId] = useState(null);
  const [onPositionChangedCalled, setOnPositionChangedCalled] = useState(false);
  const scrollViewRef = useRef(null);

  const _move = (index: number, animated: boolean = true) => {
    const isUpdating = index !== _getPosition();
    const x = Dimensions.get('window').width * index;

    scrollViewRef.current && scrollViewRef.current.scrollTo({ y: 0, x, animated });

    setPosition(index);

    if (
      isUpdating &&
      props.onPositionChanged &&
      index < props.images.length &&
      index > -1
    ) {
      props.onPositionChanged(index);
      setOnPositionChangedCalled(true);
    }

    _setInterval();
  };

  const _getPosition = () => {
    if (typeof props.position === 'number') {
      return props.position;
    }
    return position;
  };

  useEffect(() => {
    if (props.position && props.position !== position) {
      _move(props.position);
    }
  }, [props.position]);

  const _clearInterval = () => intervalId && clearInterval(intervalId);

  const _setInterval = () => {
    _clearInterval();
    const { autoPlayWithInterval, images, loop, loopBothSides } = props;

    if (autoPlayWithInterval) {
      setIntervalId(setInterval(() => {
        _move(
          !(loop || loopBothSides) && position === images.length - 1
            ? 0
            : position + 1,
        );
      }, autoPlayWithInterval));
    }
  };

  const _handleScroll = (event: Object) => {
    const { loop, loopBothSides, images, onPositionChanged } = props;
    const { x } = event.nativeEvent.contentOffset;

    if ((loop || loopBothSides) && x.toFixed() >= +(width * images.length).toFixed()) {
      return _move(0, false);
    } else if (loopBothSides && x.toFixed() <= +(-width).toFixed()) {
      return _move(images.length - 1, false);
    }

    let newPosition = 0;

    if (position !== -1 && position !== images.length) {
      newPosition = Math.round(event.nativeEvent.contentOffset.x / width);
      setPosition(newPosition);
    }

    if (
      onPositionChanged &&
      !onPositionChangedCalled &&
      newPosition < images.length &&
      newPosition > -1
    ) {
      onPositionChanged(newPosition);
    } else {
      setOnPositionChangedCalled(false);
    }

    _setInterval();
  };

  useEffect(() => {
    _setInterval();
    return () => _clearInterval();
  }, []);

  const _onLayout = () => {
    setWidth(Dimensions.get('window').width);
    _move(position, false);
  };

  const _renderImage = (image: any, index: number) => {
    const { onPress, customSlide } = props;
    const offset = { marginLeft: index === -1 ? -width : 0 };
    const imageStyle = [styles.image, { width }, offset];

    if (customSlide) {
      return customSlide({ item: image, style: imageStyle, index, width });
    }

    const imageObject = typeof image === 'string' ? { uri: image } : image;

    const imageComponent = (
      <Image key={index} source={imageObject} style={[imageStyle]} />
    );

    if (onPress) {
      return (
        <TouchableOpacity
          key={index}
          style={[imageStyle, offset]}
          onPress={() => onPress && onPress({ image, index })}
          delayPressIn={200}
        >
          {imageComponent}
        </TouchableOpacity>
      );
    }

    return imageComponent;
  };

  const _scrollEnabled = (position: number) =>
    position !== -1 && position !== props.images.length;

  const {
    customButtons,
    style,
    loop,
    images,
    loopBothSides,
  } = props;
  const scrollEnabled = _scrollEnabled(position);

  return (
    <View style={[styles.container, style]} onLayout={_onLayout}>
      <ScrollView
        onLayout={_onLayout}
        ref={scrollViewRef}
        onMomentumScrollEnd={_handleScroll}
        scrollEventThrottle={16}
        pagingEnabled={true}
        bounces={loopBothSides}
        contentInset={loopBothSides ? { left: width } : {}}
        horizontal={true}
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        style={[styles.scrollViewContainer, style]}
      >
        {loopBothSides && _renderImage(images[images.length - 1], -1)}
        {images.map(_renderImage)}
        {(loop || loopBothSides) && _renderImage(images[0], images.length)}
      </ScrollView>
      {customButtons ? (
        customButtons(position, _move)
      ) : (
        <View style={styles.buttons}>
          {props.images.map((image, index) => (
            <TouchableHighlight
              key={index}
              underlayColor="#ccc"
              onPress={() => _move(index)}
              style={[
                styles.button,
                position === index && styles.buttonSelected,
              ]}
            >
              <View />
            </TouchableHighlight>
          ))}
        </View>
      )}
      {!props.loopBothSides && position === 0 && (
        <View style={{ position: 'absolute', width: 50, height: '100%' }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContainer: {
    flexDirection: 'row',
    backgroundColor: '#222',
  },
  image: {
    width: 200,
    height: '100%',
  },
  buttons: {
    height: 15,
    marginTop: -25,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  button: {
    margin: 3,
    width: 8,
    height: 8,
    borderRadius: 8 / 2,
    backgroundColor: '#ccc',
    opacity: 0.9,
  },
  buttonSelected: {
    opacity: 1,
    backgroundColor: '#fff',
  },
});

export default ImageSlider;
