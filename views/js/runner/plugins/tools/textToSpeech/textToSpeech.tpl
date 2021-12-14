<div class="text-to-speech hidden">
    <div class="action click-to-speak" data-control="clickToSpeak" title="{{__ 'Click to speak'}}"><span class="icon-click-to-speak"></span></div>
    <div class="action play" data-control="play" title="{{__ 'Play'}}"><span class="icon-play"></span></div>
    <div class="action pause" data-control="pause" title="{{__ 'Pause'}}"><span class="icon-pause"></span></div>
    <div class="action stop" data-control="stop" title="{{__ 'Stop'}}"><span class="icon-stop"></span></div>

    <div class="action settings" title="{{__ 'Settings'}}">
        <span class="icon-settings"></span>
        <div class="settings-menu">
            {{#if allowVolumeSetting}}
            <div class="option volume" title="{{__ 'Volume'}}">
                <span class="icon-volume"></span>
                <div class="slider-container">
                    <div class="slider"></div>
                </div>
                <div class="hover-container"></div>
            </div>
            {{/if}}
            <div class="option speed" title="{{__ 'Speech speed'}}">
                <span class="icon-speed"></span>
                <div class="slider-container">
                    <div class="slider"></div>
                </div>
                <div class="hover-container"></div>
            </div>
        </div>
    </div>
</div>
