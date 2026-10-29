import { Component } from "@angular/core";
import { WheelComponent } from "./components/wheel.component";

@Component({
  selector: "app-root",
  imports: [WheelComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {}
