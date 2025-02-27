import type { VNode } from 'vue';
import {
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  watch,
  ref,
  defineComponent,
  nextTick,
  withDirectives,
} from 'vue';
import antInputDirective from '../_util/antInputDirective';
import classNames from '../_util/classNames';
import type { InputProps } from './inputProps';
import inputProps from './inputProps';
import type { Direction, SizeType } from '../config-provider';
import ClearableLabeledInput from './ClearableLabeledInput';
import { useInjectFormItemContext } from '../form/FormItemContext';
import omit from '../_util/omit';
import useConfigInject from '../_util/hooks/useConfigInject';
import type { ChangeEvent, FocusEventHandler } from '../_util/EventInterface';

export function fixControlledValue(value: string | number) {
  if (typeof value === 'undefined' || value === null) {
    return '';
  }
  return value;
}

export function resolveOnChange(
  target: HTMLInputElement,
  e: Event,
  onChange: Function,
  targetValue?: string,
) {
  if (!onChange) {
    return;
  }
  const event: any = e;
  const originalInputValue = target.value;

  if (e.type === 'click') {
    Object.defineProperty(event, 'target', {
      writable: true,
    });
    Object.defineProperty(event, 'currentTarget', {
      writable: true,
    });
    // click clear icon
    //event = Object.create(e);
    event.target = target;
    event.currentTarget = target;
    // change target ref value cause e.target.value should be '' when clear input
    target.value = '';
    onChange(event);
    // reset target ref value
    target.value = originalInputValue;
    return;
  }
  // Trigger by composition event, this means we need force change the input value
  if (targetValue !== undefined) {
    Object.defineProperty(event, 'target', {
      writable: true,
    });
    Object.defineProperty(event, 'currentTarget', {
      writable: true,
    });
    event.target = target;
    event.currentTarget = target;
    target.value = targetValue;
    onChange(event);
    return;
  }
  onChange(event);
}

export function getInputClassName(
  prefixCls: string,
  bordered: boolean,
  size?: SizeType,
  disabled?: boolean,
  direction?: Direction,
) {
  return classNames(prefixCls, {
    [`${prefixCls}-sm`]: size === 'small',
    [`${prefixCls}-lg`]: size === 'large',
    [`${prefixCls}-disabled`]: disabled,
    [`${prefixCls}-rtl`]: direction === 'rtl',
    [`${prefixCls}-borderless`]: !bordered,
  });
}

export interface InputFocusOptions extends FocusOptions {
  cursor?: 'start' | 'end' | 'all';
}
export function triggerFocus(
  element?: HTMLInputElement | HTMLTextAreaElement,
  option?: InputFocusOptions,
) {
  if (!element) return;

  element.focus(option);

  // Selection content
  const { cursor } = option || {};
  if (cursor) {
    const len = element.value.length;

    switch (cursor) {
      case 'start':
        element.setSelectionRange(0, 0);
        break;

      case 'end':
        element.setSelectionRange(len, len);
        break;

      default:
        element.setSelectionRange(0, len);
    }
  }
}

export default defineComponent({
  name: 'AInput',
  inheritAttrs: false,
  props: {
    ...inputProps,
  },
  setup(props, { slots, attrs, expose, emit }) {
    const inputRef = ref();
    const clearableInputRef = ref();
    let removePasswordTimeout: any;
    const formItemContext = useInjectFormItemContext();
    const { direction, prefixCls, size, autocomplete } = useConfigInject('input', props);
    const stateValue = ref(props.value === undefined ? props.defaultValue : props.value);
    const focused = ref(false);

    watch(
      () => props.value,
      () => {
        if (props.value !== undefined) {
          stateValue.value = props.value;
        }
      },
    );
    watch(
      () => props.disabled,
      () => {
        if (props.value !== undefined) {
          stateValue.value = props.value;
        }
      },
    );

    const clearPasswordValueAttribute = () => {
      // https://github.com/ant-design/ant-design/issues/20541
      removePasswordTimeout = setTimeout(() => {
        if (
          inputRef.value?.getAttribute('type') === 'password' &&
          inputRef.value.hasAttribute('value')
        ) {
          inputRef.value.removeAttribute('value');
        }
      });
    };

    const focus = (option?: InputFocusOptions) => {
      triggerFocus(inputRef.value, option);
    };

    const blur = () => {
      inputRef.value?.blur();
    };

    const setSelectionRange = (
      start: number,
      end: number,
      direction?: 'forward' | 'backward' | 'none',
    ) => {
      inputRef.value?.setSelectionRange(start, end, direction);
    };

    const select = () => {
      inputRef.value?.select();
    };

    expose({
      focus,
      blur,
      input: inputRef,
      stateValue,
      setSelectionRange,
      select,
    });

    const onFocus: FocusEventHandler = e => {
      const { onFocus } = props;
      focused.value = true;
      onFocus?.(e);
      nextTick(() => {
        clearPasswordValueAttribute();
      });
    };

    const onBlur: FocusEventHandler = e => {
      const { onBlur } = props;
      focused.value = false;
      onBlur?.(e);
      formItemContext.onFieldBlur();
      nextTick(() => {
        clearPasswordValueAttribute();
      });
    };

    const triggerChange = (e: Event) => {
      emit('update:value', (e.target as HTMLInputElement).value);
      emit('change', e);
      emit('input', e);
      formItemContext.onFieldChange();
    };
    const instance = getCurrentInstance();
    const setValue = (value: string | number, callback?: Function) => {
      if (stateValue.value === value) {
        return;
      }
      if (props.value === undefined) {
        stateValue.value = value;
      } else {
        instance.update();
      }
      nextTick(() => {
        callback && callback();
      });
    };
    const handleReset = (e: MouseEvent) => {
      resolveOnChange(inputRef.value, e, triggerChange);
      setValue('', () => {
        focus();
      });
    };

    const handleChange = (e: ChangeEvent) => {
      const { value, composing } = e.target as any;
      // https://github.com/vueComponent/ant-design-vue/issues/2203
      if ((((e as any).isComposing || composing) && props.lazy) || stateValue.value === value)
        return;
      const newVal = e.target.value;
      resolveOnChange(inputRef.value, e, triggerChange);
      setValue(newVal, () => {
        clearPasswordValueAttribute();
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === 13) {
        emit('pressEnter', e);
      }
      emit('keydown', e);
    };

    onMounted(() => {
      if (process.env.NODE_ENV === 'test') {
        if (props.autofocus) {
          focus();
        }
      }
      clearPasswordValueAttribute();
    });
    onBeforeUnmount(() => {
      clearTimeout(removePasswordTimeout);
    });

    const renderInput = () => {
      const {
        addonBefore = slots.addonBefore,
        addonAfter = slots.addonAfter,
        disabled,
        bordered = true,
        valueModifiers = {},
        htmlSize,
      } = props;
      const otherProps = omit(props as InputProps & { inputType: any; placeholder: string }, [
        'prefixCls',
        'onPressEnter',
        'addonBefore',
        'addonAfter',
        'prefix',
        'suffix',
        'allowClear',
        // Input elements must be either controlled or uncontrolled,
        // specify either the value prop, or the defaultValue prop, but not both.
        'defaultValue',
        'size',
        'inputType',
        'bordered',
        'htmlSize',
        'lazy',
      ]);
      const inputProps = {
        ...otherProps,
        ...attrs,
        autocomplete: autocomplete.value,
        onChange: handleChange,
        onInput: handleChange,
        onFocus,
        onBlur,
        onKeydown: handleKeyDown,
        class: classNames(
          getInputClassName(prefixCls.value, bordered, size.value, disabled, direction.value),
          {
            [attrs.class as string]: attrs.class && !addonBefore && !addonAfter,
          },
        ),
        ref: inputRef,
        key: 'ant-input',
        size: htmlSize,
        id: otherProps.id ?? formItemContext.id.value,
      };
      if (valueModifiers.lazy) {
        delete inputProps.onInput;
      }
      if (!inputProps.autofocus) {
        delete inputProps.autofocus;
      }
      const inputNode = <input {...inputProps} />;
      return withDirectives(inputNode as VNode, [[antInputDirective]]);
    };

    return () => {
      const inputProps: any = {
        ...attrs,
        ...props,
        prefixCls: prefixCls.value,
        inputType: 'input',
        value: fixControlledValue(stateValue.value),
        handleReset,
        focused: focused.value && props.disabled,
      };

      return (
        <ClearableLabeledInput
          {...omit(inputProps, ['element', 'valueModifiers'])}
          ref={clearableInputRef}
          v-slots={{ ...slots, element: renderInput }}
        />
      );
    };
  },
});
