import {
    ComponentFactoryResolver,
    Directive,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    ReflectiveInjector,
    ViewContainerRef
} from '@angular/core';

import {ColorPickerService} from './color-picker.service';
import {ColorPickerComponent} from './color-picker.component';

@Directive({
    selector: '[colorPicker]',
    host: {
        '(input)': 'changeInput($event.target.value)',
        '(click)': 'onClick()'
    }
})
export class ColorPickerDirective implements OnInit, OnChanges {
    @Input('colorPicker') colorPicker: string;
    @Output('colorPickerChange') colorPickerChange = new EventEmitter<string>(true);
    @Input('cpToggle') cpToggle: boolean;
    @Output('cpToggleChange') cpToggleChange = new EventEmitter<boolean>(true);
    @Input('cpPosition') cpPosition = 'right';
    @Input('cpPositionOffset') cpPositionOffset = '0%';
    @Input('cpPositionRelativeToArrow') cpPositionRelativeToArrow = false;
    @Input('cpOutputFormat') cpOutputFormat = 'hex';
    @Input('cpPresetLabel') cpPresetLabel = 'Preset colors';
    @Input('cpPresetColors') cpPresetColors: Array<string>;
    @Input('cpCancelButton') cpCancelButton = false;
    @Input('cpCancelButtonClass') cpCancelButtonClass = 'cp-cancel-button-class';
    @Input('cpCancelButtonText') cpCancelButtonText = 'Cancel';
    @Input('cpOKButton') cpOKButton = false;
    @Input('cpOKButtonClass') cpOKButtonClass = 'cp-ok-button-class';
    @Input('cpOKButtonText') cpOKButtonText = 'OK';
    @Input('cpFallbackColor') cpFallbackColor = '#fff';
    @Input('cpHeight') cpHeight = 'auto';
    @Input('cpWidth') cpWidth = '230px';
    @Input('cpIgnoredElements') cpIgnoredElements: any = [];
    @Input('cpDialogDisplay') cpDialogDisplay = 'popup';
    @Input('cpSaveClickOutside') cpSaveClickOutside = true;
    @Input('cpAlphaChannel') cpAlphaChannel = 'hex6';

    private dialog: any;
    private created: boolean;
    private ignoreChanges = false;

    constructor(private vcRef: ViewContainerRef, private el: ElementRef,
                private service: ColorPickerService, private cfr: ComponentFactoryResolver) {
        this.created = false;
    }

    ngOnChanges(changes: any): void {
        if (changes.cpToggle) {
            if (changes.cpToggle.currentValue) {
                this.openDialog();
            }
            if (!changes.cpToggle.currentValue && this.dialog) {
                this.dialog.closeColorPicker();
            }
        }
        if (changes.colorPicker) {
            if (this.dialog && !this.ignoreChanges) {
                if (this.cpDialogDisplay === 'inline') {
                    this.dialog.setInitialColor(changes.colorPicker.currentValue);
                }
                this.dialog.setColorFromString(changes.colorPicker.currentValue, false);

            }
            this.ignoreChanges = false;
        }
        if (changes.cpPresetLabel ||  changes.cpPresetColors) {
            if (this.dialog) {
                this.dialog.setPresetConfig(this.cpPresetLabel, this.cpPresetColors);
            }
        }
    }

    ngOnInit() {
        let hsva = this.service.stringToHsva(this.colorPicker);
        if (hsva === null) {
            hsva = this.service.stringToHsva(this.colorPicker, true);
        }
        if (hsva == null) {
            hsva = this.service.stringToHsva(this.cpFallbackColor);
        }
        this.colorPickerChange.emit(
            ColorPickerService.outputFormat(hsva, this.cpOutputFormat, this.cpAlphaChannel === 'hex8')
        );
    }

    onClick() {
        if (this.cpIgnoredElements.filter((item: any) => item === this.el.nativeElement).length === 0) {
            this.openDialog();
        }
    }

    openDialog() {
        if (!this.created) {
            this.created = true;
            const compFactory = this.cfr.resolveComponentFactory(ColorPickerComponent);
            const injector = ReflectiveInjector.fromResolvedProviders([], this.vcRef.parentInjector);
            const cmpRef = this.vcRef.createComponent(compFactory, 0, injector, []);
            cmpRef.instance.setDialog(this, this.el, this.colorPicker, this.cpPosition, this.cpPositionOffset,
                this.cpPositionRelativeToArrow, this.cpOutputFormat, this.cpPresetLabel, this.cpPresetColors,
                this.cpCancelButton, this.cpCancelButtonClass, this.cpCancelButtonText, this.cpOKButton,
                this.cpOKButtonClass, this.cpOKButtonText, this.cpHeight, this.cpWidth, this.cpIgnoredElements,
                this.cpDialogDisplay, this.cpSaveClickOutside, this.cpAlphaChannel);
            this.dialog = cmpRef.instance;
        } else if (this.dialog) {
            this.dialog.openDialog(this.colorPicker);
        }
    }

    colorChanged(value: string, ignore = true) {
        this.ignoreChanges = ignore;
        this.colorPickerChange.emit(value);
    }

    changeInput(value: string) {
        this.dialog.setColorFromString(value, true);
    }

    toggle(value: boolean) {
        this.cpToggleChange.emit(value);
    }
}
